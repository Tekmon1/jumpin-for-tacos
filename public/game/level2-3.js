(() => {
  'use strict';
  const SOURCE_VERSION = 'w2-3-v29-roadie-utility-crawler';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  const heroCore = window.JFT_HERO_CORE;
  const heroPhysics = heroCore.physics;
  const abilities = window.JFT_SHARED_ABILITIES;
  const audio = window.JFT_AUDIO;

  const ui = {
    startOverlay: document.getElementById('startOverlay'),
    winOverlay: document.getElementById('winOverlay'),
    settingsOverlay: document.getElementById('settingsOverlay'),
    startBtn: document.getElementById('startBtn'),
    restartBtn: document.getElementById('restartBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    skipConcertBtn: document.getElementById('skipConcertBtn'),
    muteBtn: document.getElementById('muteBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    musicVolume: document.getElementById('musicVolume'),
    effectsVolume: document.getElementById('effectsVolume'),
    musicVolumeValue: document.getElementById('musicVolumeValue'),
    effectsVolumeValue: document.getElementById('effectsVolumeValue'),
    reducedShake: document.getElementById('reducedShake'),
    personalBestText: document.getElementById('personalBestText'),
    medalBadge: document.getElementById('medalBadge'),
    resultScore: document.getElementById('resultScore'),
    resultTime: document.getElementById('resultTime'),
    resultTacos: document.getElementById('resultTacos'),
    resultGolden: document.getElementById('resultGolden'),
    resultEnergy: document.getElementById('resultEnergy'),
    resultConcert: document.getElementById('resultConcert'),
    winText: document.getElementById('winText'),
    newBestText: document.getElementById('newBestText'),
  };

  const WORLD_WIDTH = 35000;
  const GROUND_Y = 460;
  const CONCERT_STAGE_FLOOR_Y = 420;
  const BOAT_WATERLINE_Y = 451;
  const BOAT_LEAD_DISTANCE = 400;
  const BOAT_THROW_DURATION = .72;
  const BOAT_THROW_RELEASE = .46;
  const BOAT_RENDER_WIDTH = 270;
  const BOAT_LAUNCH_X_OFFSET = -122;
  const BOAT_LAUNCH_Y_OFFSET = -106;
  const CONCERT_ENTRY_TRIGGER_X = 34820;
  const FEEDBACK_FIEND_ARENA = Object.freeze({ left: 32720, right: 33780, triggerX: 32845 });
  const FEEDBACK_FIEND_X = 33465;
  const FEEDBACK_FIEND_MAX_HEALTH = 3;
  const FEEDBACK_FIEND_REWARD_X = 33210;
  const CONCERT_ENCORE_ENERGY = 100;
  const OPENING_ROADSTER_SOURCE_WIDTH = 215;
  const OPENING_ROADSTER_SOURCE_HEIGHT = 148;
  const OPENING_ROADSTER_DRAW_WIDTH = 172;
  const OPENING_ROADSTER_DRAW_HEIGHT = OPENING_ROADSTER_SOURCE_HEIGHT
    * (OPENING_ROADSTER_DRAW_WIDTH / OPENING_ROADSTER_SOURCE_WIDTH);
  const OPENING_LOADING_DRAW_WIDTH = 150;
  const OPENING_LOADING_DRAW_HEIGHT = 120;
  const MIDGROUND_PANEL_HEIGHT = 204;
  const ENVIRONMENT_TRANSITION_WIDTH = 1600;
  const ENVIRONMENT_PANORAMA_CROP = .9;
  const OPENING_ROADSTER_X = 430;
  const CHORUS_WINDOWS = Object.freeze([
    { id: 'chorus-one', start: 68, end: 93, interval: 5.2 },
    { id: 'finale-chorus', start: 142, end: 168, interval: 5.2 },
  ]);
  const openingTimeline = {
    loadingEnd: 2,
    boardingEnd: 2.65,
    revvingEnd: 3.2,
    departingEnd: 5.9,
  };
  const sections = [
    { id: 'soundcheck', name: 'Sunrise Soundcheck', start: 0, end: 5500, music: 'soundcheck', accent: '#ffd65a' },
    { id: 'beach', name: 'Backstage Pass Beach', start: 5500, end: 11000, music: 'soundcheck', accent: '#50e7ff' },
    { id: 'rooftops', name: 'Roadie Rooftops', start: 11000, end: 17000, music: 'rooftops', accent: '#ff4fac' },
    { id: 'stampede', name: 'Speaker Stack Stampede', start: 17000, end: 20500, music: 'stampede', accent: '#a4f766' },
    { id: 'lagoon', name: 'Neon Lagoon Rehearsal', start: 20500, end: 28000, music: 'lagoon', accent: '#50e7ff' },
    { id: 'powerup', name: 'Power Up the Stage', start: 28000, end: 33000, music: 'powerup', accent: '#b780ff' },
    { id: 'victory', name: 'Golden Ticket Victory Dash', start: 33000, end: WORLD_WIDTH, music: 'powerup', accent: '#ffd65a' },
  ];
  const BASS_STACK_LAUNCH_VELOCITY = 600;
  const BASS_STACK_BEAT_SECONDS = 1.34;
  const MARQUEE_STRUCTURE = Object.freeze({
    centerX: 3700,
    bottomY: GROUND_Y + 3,
    drawWidth: 800,
    drawHeight: 456,
    leftFootingX: 3435,
    rightFootingX: 3940,
    liftRailX: 3405,
    signPanel: Object.freeze({ x: 3568, y: 112, w: 264, h: 58 }),
  });
  const MARQUEE_WELCOME_BOOTH = Object.freeze({
    x: 3065,
    bottomY: GROUND_Y + 20,
    drawWidth: 300,
    drawHeight: 124,
    roofCollisionY: 366,
    signPanel: Object.freeze({ x: 3156, y: 371, w: 118, h: 29 }),
  });
  const MARQUEE_GROUND_FOUNDATION = Object.freeze({ startX: 3002, endX: 4207 });
  const ROADIE_ROOFTOPS_STRUCTURE = Object.freeze({
    startX: 11180,
    endX: 14540,
    loadingAnnexEndX: 12880,
    buildingX: 13720,
    buildingBottomY: GROUND_Y + 3,
    buildingDrawWidth: 762,
    buildingDrawHeight: 450,
    venueSourceWidth: 1481,
    venueSourceHeight: 875,
    previousVenueCropFraction: .14,
    previousBuildingDrawWidth: 1780,
    previousBuildingDrawHeight: 450,
    liftRailX: 12680,
    rehearsalDeckY: 136,
  });
  const ROADIE_SERVICE_CLUSTER = Object.freeze({
    equipmentName: 'POWER + SIGNAL',
    equipment: Object.freeze({
      x: 12890, y: 180, w: 455, h: 300,
      source: Object.freeze({ x: 0, y: 0, w: 1190, h: 785 }),
      label: Object.freeze({ x: 13028, y: 298, w: 178, h: 22 }),
    }),
    vent: Object.freeze({
      x: 13405, y: 260, w: 350, h: 245,
      source: Object.freeze({ x: 1130, y: 300, w: 692, h: 485 }),
      label: Object.freeze({ x: 13508, y: 348, w: 142, h: 20 }),
      fanCenters: Object.freeze([
        Object.freeze({ x: 13513, y: 385, r: 39 }),
        Object.freeze({ x: 13610, y: 385, r: 39 }),
      ]),
    }),
  });
  const CABLE_CRAWLER_MAX_HEALTH = 3;
  const CABLE_CRAWLER_ARENA = Object.freeze({
    left: 12920,
    right: 13310,
    platformY: 278,
    trigger: Object.freeze({ x: 12938, y: 178, w: 350, h: 104 }),
    safeDropToMainRoute: true,
  });
  const CABLE_CRAWLER_X = 13115;
  const WORLD23_PHASE2_STATIONS = Object.freeze([
    Object.freeze({
      id: 'marquee', name: 'Neon Neckties Welcome Arch', completion: 'MARQUEE ONLINE',
      start: 3000, end: 4380, accent: '#50e7ff', score: 3200, energy: 4,
      traversal: 'grounded-check-in-roof-west-tower-service-lift-crossbeam-super-gap-east-tower-activation-perch',
      trigger: Object.freeze({ x: 3635, y: 36, w: 340, h: 88 }),
      reward: Object.freeze({ x: 3650, y: 58, count: 10, columns: 10, rainbowEvery: 4 }),
      platforms: Object.freeze([
        Object.freeze({ x: 3090, y: 366, w: 250, kind: 'marquee-check-in-awning', routeShape: 'lower-approach-jump' }),
        Object.freeze({ x: 3230, y: 314, w: 150, kind: 'marquee-west-tower-ledge', routeShape: 'vertical-tower-climb' }),
        Object.freeze({ x: 3405, y: 354, w: 156, kind: 'marquee-service-lift', routeShape: 'vertical-service-lift', moving: true, axis: 'y', range: 60, speed: .48, phase: 0 }),
        Object.freeze({ x: 3570, y: 286, w: 275, kind: 'marquee-maintenance-catwalk', routeShape: 'crossbeam-side-transfer' }),
        Object.freeze({ x: 4105, y: 286, w: 168, kind: 'marquee-east-sign-ledge', routeShape: 'super-double-jump-gap' }),
        Object.freeze({ x: 3985, y: 176, w: 202, kind: 'marquee-east-tower-crossbeam', routeShape: 'upper-tower-climb' }),
        Object.freeze({ x: 3645, y: 98, w: 315, kind: 'marquee-activation-perch', routeShape: 'final-sign-access-jump', summit: true }),
      ]),
    }),
    Object.freeze({
      id: 'rooftops', name: 'Roadie Rooftops Soundcheck', completion: 'SOUNDCHECK COMPLETE',
      start: 11160, end: 14540, accent: '#a4f766', score: 4200, energy: 6,
      traversal: 'grounded-loading-bay-road-cases-freight-lift-utility-roofs-bass-launch-truss-final-super-jump',
      trigger: Object.freeze({ x: 13760, y: 58, w: 720, h: 94 }),
      reward: Object.freeze({ x: 13820, y: 78, count: 12, columns: 6, rainbowEvery: 3 }),
      platforms: Object.freeze([
        Object.freeze({ x: 11260, y: 312, w: 520, kind: 'roadie-loading-awning', routeShape: 'grounded-loading-dock-approach' }),
        Object.freeze({ x: 11890, y: 326, w: 230, kind: 'roadie-road-case-stack', routeShape: 'horizontal-road-case-transfer' }),
        Object.freeze({ x: 12240, y: 282, w: 330, kind: 'roadie-maintenance-balcony', routeShape: 'balcony-diagonal-transfer' }),
        Object.freeze({ x: 12680, y: 360, w: 190, kind: 'roadie-freight-lift', routeShape: 'vertical-freight-lift', moving: true, axis: 'y', range: 80, speed: .38, phase: 0 }),
        Object.freeze({ x: 12920, y: 278, w: 390, kind: 'roadie-crawler-service-deck', routeShape: 'lift-to-supported-crawler-deck' }),
        Object.freeze({ x: 13420, y: 320, w: 300, kind: 'roadie-vent-housing', routeShape: 'horizontal-duct-transfer' }),
        Object.freeze({ x: 13800, y: 342, w: 240, kind: 'roadie-bass-launch', routeShape: 'single-bass-powered-launch', bassPad: true }),
        Object.freeze({ x: 13940, y: 230, w: 360, kind: 'roadie-truss-bridge', routeShape: 'bass-launch-to-truss' }),
        Object.freeze({ x: 14320, y: 228, w: 190, kind: 'roadie-upper-access-ledge', routeShape: 'short-side-transfer' }),
        Object.freeze({ x: 13720, y: 136, w: 780, kind: 'roadie-rehearsal-roof', routeShape: 'final-super-double-jump', summit: true }),
      ]),
      characters: Object.freeze([2, 4]),
      dialogueX: 14040,
      dialogue: 'ONE MORE TIME. MAKE IT SHAKE.',
    }),
    Object.freeze({
      id: 'lagoon', name: 'Neon Lagoon Rehearsal', completion: 'LAGOON REHEARSAL READY',
      start: 19580, end: 22080, accent: '#50e7ff', score: 3600, energy: 5,
      traversal: 'waterfront-pontoons-suspended-rehearsal-structures',
      trigger: Object.freeze({ x: 21520, y: 164, w: 390, h: 116 }),
      reward: Object.freeze({ x: 21420, y: 178, count: 10, rainbowEvery: 4 }),
      platforms: Object.freeze([
        Object.freeze({ x: 19640, y: 366, w: 390, kind: 'lagoon-dock-roof' }),
        Object.freeze({ x: 20120, y: 396, w: 258, kind: 'lagoon-floating-pontoon', moving: true, axis: 'y', range: 11, speed: .68, phase: .8 }),
        Object.freeze({ x: 20490, y: 276, w: 466, kind: 'lagoon-rehearsal-deck' }),
        Object.freeze({ x: 21020, y: 334, w: 258, kind: 'lagoon-rope-deck', moving: true, axis: 'x', range: 46, speed: .63, phase: 2.2 }),
        Object.freeze({ x: 21360, y: 210, w: 286, kind: 'lagoon-hanging-truss' }),
        Object.freeze({ x: 21670, y: 272, w: 360, kind: 'lagoon-lookout', summit: true }),
      ]),
      characters: Object.freeze([1]),
      dialogueX: 20690,
      dialogue: 'TRY THE PINK ONE!',
    }),
    Object.freeze({
      id: 'golden', name: 'Golden Ticket Victory Dash', completion: 'GOLDEN TICKET',
      start: 27320, end: 29420, accent: '#ffd65a', score: 4500, energy: 5,
      traversal: 'fast-forward-flow-ticket-arches-and-moving-signs',
      trigger: Object.freeze({ x: 29215, y: 144, w: 205, h: 126 }),
      reward: Object.freeze({ x: 29020, y: 164, count: 12, rainbowEvery: 3 }),
      platforms: Object.freeze([
        Object.freeze({ x: 27380, y: 354, w: 370, kind: 'golden-ticket-booth-roof' }),
        Object.freeze({ x: 27840, y: 298, w: 220, kind: 'golden-banner-carriage', moving: true, axis: 'x', range: 48, speed: .82, phase: .45 }),
        Object.freeze({ x: 28150, y: 374, w: 188, kind: 'golden-road-case' }),
        Object.freeze({ x: 28420, y: 278, w: 300, kind: 'golden-ticket-ring' }),
        Object.freeze({ x: 28790, y: 214, w: 194, kind: 'golden-neon-arrow', moving: true, axis: 'y', range: 20, speed: .92, phase: 1.3 }),
        Object.freeze({ x: 29080, y: 286, w: 292, kind: 'golden-admission-bridge' }),
        Object.freeze({ x: 29230, y: 232, w: 190, kind: 'golden-ticket-summit', summit: true }),
      ]),
      characters: Object.freeze([3]),
      dialogueX: 29230,
      dialogue: 'ALMOST SHOWTIME.',
    }),
    Object.freeze({
      id: 'encore', name: 'Encore Stash', completion: 'ENCORE STASH DISCOVERED!',
      start: 29420, end: 29980, accent: '#fff170', score: 12000, energy: 10,
      secret: true,
      traversal: 'concealed-curtain-gap-beyond-ticket-destination',
      trigger: Object.freeze({ x: 29620, y: 42, w: 310, h: 118 }),
      reward: Object.freeze({ x: 29560, y: 62, count: 18, rainbowEvery: 2 }),
      platforms: Object.freeze([
        Object.freeze({ x: 29570, y: 128, w: 360, kind: 'encore-stash', summit: true, secret: true }),
      ]),
    }),
  ]);
  const WORLD23_PHASE2_VISIBLE_IDS = Object.freeze(['marquee', 'rooftops', 'lagoon', 'golden']);
  const WORLD23_PHASE2_PROTECTED_RANGES = Object.freeze(
    WORLD23_PHASE2_STATIONS.map((station) => Object.freeze({ start: station.start, end: station.end })),
  );
  const environmentImageKeys = Object.freeze({
    soundcheck: 'environmentSoundcheck',
    beach: 'environmentBeach',
    rooftops: 'environmentRooftops',
    stampede: 'environmentStampede',
    lagoon: 'environmentLagoon',
    powerup: 'environmentPowerup',
    victory: 'environmentVictory',
  });
  const terrainRows = Object.freeze({
    soundcheck: 0,
    beach: 1,
    rooftops: 2,
    stampede: 3,
    lagoon: 4,
    powerup: 5,
    victory: 6,
  });
  const checkpointDefs = [
    { x: 5200, name: 'Soundcheck Shack', sign: 'OLIVIA RADIO: DO NOT FEED THE SPEAKERS AFTER MIDNIGHT.', accent: '#ffd65a', look: 0 },
    { x: 10800, name: 'Backstage Beach Gate', sign: 'OLIVIA RADIO: THE BAND REQUESTED WATER. I BROUGHT SPARKLING SALSA.', accent: '#50e7ff', look: 1 },
    { x: 16500, name: 'Rooftop Roadie Stop', sign: 'OLIVIA RADIO: REX CALLED THIS A QUIET SOUNDCHECK. PROTECT YOUR TACOS.', accent: '#ff4fac', look: 2 },
    { x: 22000, name: 'Speaker Safety Station', sign: 'OLIVIA RADIO: IF THE BASS MOVES YOUR HAIR, THE BASS IS WORKING.', accent: '#a4f766', look: 3 },
    { x: 27020, name: 'Lagoon Light Dock', sign: 'OLIVIA RADIO: ARMAN PLUGGED THE KEYBOARD INTO A PALM TREE. IT STILL WORKED.', accent: '#50e7ff', look: 4 },
    { x: 32420, name: 'Neon Power Gate', sign: 'OLIVIA RADIO: NOVA SAYS THE ENCORE NEEDS MORE TACOS. THIS IS NOT A DRILL.', accent: '#b780ff', look: 5 },
  ];
  const fanChatLines = [
    'NEON NECKTIES FOREVER!', 'JUMP FOR TACOS!', 'PLAY THE ONE ABOUT THE TACOS!',
    'TURN THE SUNSET UP!', 'NOVA, HIT THAT NOTE!', 'JET, MAKE IT GLOW!',
    'MILO, BRING THE BASS!', 'ARMAN, LIGHT UP THE KEYS!', 'REX, DROP THE BEAT!',
    'FIVE TIES, ONE SOUND!', 'NEON IN MY HEART!', 'PROUD TIE-HARD!',
    'COCONUT COVE LOVES YOU!', 'WE JUMP FOR TACOS!', 'I SURVIVED SOUNDCHECK!',
    'BEST NIGHT ON THE ISLAND!', 'TACO TOUR FOREVER!', 'ONE MORE SONG!', 'ENCORE!',
  ];
  const WORLD23_OPENING_SAFE_END = 900;
  const WORLD23_ORDINARY_COMBAT_END = 28000;
  const WORLD23_CATAMARAN_CLEAR_CORRIDOR = Object.freeze({ start: 22500, end: 27200 });
  const world23RoutePatterns = Object.freeze({
    soundcheck: Object.freeze([
      { dx: 0, y: 378, w: 156, kind: 'roadie-crate' },
      { dx: 190, y: 332, w: 168, kind: 'cable-riser' },
      { dx: 400, y: 286, w: 204, kind: 'soundcheck-deck', summit: true },
      { dx: 650, y: 332, w: 170, kind: 'cable-riser' },
      { dx: 858, y: 378, w: 156, kind: 'roadie-crate' },
    ]),
    beach: Object.freeze([
      { dx: 0, y: 374, w: 170, kind: 'surfboard' },
      { dx: 220, y: 326, w: 190, kind: 'palm-canopy' },
      { dx: 460, y: 276, w: 210, kind: 'canopy-crown', summit: true },
      { dx: 720, y: 326, w: 190, kind: 'leaf-lift', moving: true, axis: 'y', range: 16 },
      { dx: 960, y: 374, w: 170, kind: 'surfboard' },
    ]),
    rooftops: Object.freeze([
      { dx: 0, y: 366, w: 200, kind: 'awning' },
      { dx: 246, y: 310, w: 205, kind: 'beat-platform' },
      { dx: 500, y: 254, w: 220, kind: 'roofline', summit: true, moving: true, axis: 'x', range: 18 },
      { dx: 768, y: 310, w: 205, kind: 'beat-platform' },
      { dx: 1018, y: 366, w: 180, kind: 'awning' },
    ]),
    stampede: Object.freeze([
      { dx: 0, y: 374, w: 178, kind: 'speaker-case' },
      { dx: 220, y: 322, w: 208, kind: 'speaker-stack' },
      { dx: 472, y: 270, w: 236, kind: 'bass-bridge', summit: true },
      { dx: 754, y: 322, w: 208, kind: 'speaker-lift', moving: true, axis: 'y', range: 18 },
      { dx: 1008, y: 374, w: 170, kind: 'speaker-case' },
    ]),
    lagoon: Object.freeze([
      { dx: 0, y: 378, w: 190, kind: 'surfboard' },
      { dx: 238, y: 330, w: 190, kind: 'leaf-platform' },
      { dx: 478, y: 286, w: 210, kind: 'lagoon-canopy', summit: true },
      { dx: 738, y: 334, w: 190, kind: 'leaf-lift', moving: true, axis: 'y', range: 14 },
      { dx: 978, y: 378, w: 170, kind: 'surfboard' },
    ]),
  });
  const world23GroundEncounterPlan = Object.freeze([
    { id: 'soundcheck-berry-warmup', anchorX: 1200, type: 'berry', count: 2, section: 'soundcheck', purpose: 'Open with a forgiving two-stomp soundcheck rhythm.' },
    { id: 'soundcheck-mango-cable-pack', anchorX: 2500, type: 'mango', count: 2, section: 'soundcheck', purpose: 'Teach the mango leap beside the cable risers.' },
    { id: 'soundcheck-spaghetti-count-in', anchorX: 3800, type: 'spaghetti', count: 2, section: 'soundcheck', purpose: 'Close the opening act with a readable hop-and-bounce count-in.' },
    { id: 'beach-pineapple-board-pack', anchorX: 6000, type: 'pineapple', count: 2, section: 'beach', purpose: 'Introduce the beach route with a wide pineapple patrol.' },
    { id: 'beach-berry-canopy-pack', anchorX: 7200, type: 'berry', count: 3, section: 'beach', purpose: 'Create a three-beat stomp chain beneath the palm canopy.' },
    { id: 'beach-mango-pass-pack', anchorX: 8600, type: 'mango', count: 2, section: 'beach', purpose: 'Keep the backstage-pass stretch active without crowding Jet.' },
    { id: 'beach-spaghetti-gate-pack', anchorX: 10100, type: 'spaghetti', count: 2, section: 'beach', purpose: 'Finish the beach act with a calm bounce before the checkpoint.' },
    { id: 'rooftops-pepper-beat-pack', anchorX: 11450, type: 'pepper', count: 2, section: 'rooftops', purpose: 'Signal the faster rooftop rhythm with a clean pepper pair.' },
    { id: 'rooftops-pineapple-rail-pack', anchorX: 12650, type: 'pineapple', count: 2, section: 'rooftops', purpose: 'Patrol the long rail below the optional roofline.' },
    { id: 'rooftops-berry-bass-pack', anchorX: 14350, type: 'berry', count: 3, section: 'rooftops', purpose: 'Turn the central rooftop floor into a sustained stomp sequence.' },
    { id: 'rooftops-mango-exit-pack', anchorX: 15750, type: 'mango', count: 2, section: 'rooftops', purpose: 'Close the rooftops without crowding Olivia’s radio stop.' },
    { id: 'stampede-spaghetti-entry-pack', anchorX: 17250, type: 'spaghetti', count: 2, section: 'stampede', purpose: 'Open the speaker district with a springy entry beat.' },
    { id: 'stampede-pepper-stack-pack', anchorX: 18550, type: 'pepper', count: 3, section: 'stampede', purpose: 'Make the first speaker stack a deliberate three-stomp challenge.' },
    { id: 'stampede-pineapple-bass-pack', anchorX: 20050, type: 'pineapple', count: 2, section: 'stampede', purpose: 'Give the bass bridge a bold lower-route patrol.' },
    { id: 'lagoon-berry-rehearsal-pack', anchorX: 21400, type: 'berry', count: 3, section: 'lagoon', purpose: 'Add one grounded rehearsal-floor rhythm, then end combat before Olivia’s catamaran lane.' },
  ]);
  const world23UpperEncounterPlan = Object.freeze([
    { id: 'soundcheck-upper-berry-sentry', anchorX: 1650, type: 'berry', count: 2, role: 'platform-sentry', section: 'soundcheck', purpose: 'Make the first soundcheck riser an obvious optional target.' },
    { id: 'soundcheck-upper-mango-champion', anchorX: 3350, type: 'mango', count: 1, role: 'champion', section: 'soundcheck', purpose: 'Reward the opening summit with a premium stomp.' },
    { id: 'beach-upper-pineapple-sentry', anchorX: 6250, type: 'pineapple', count: 2, role: 'platform-sentry', section: 'beach', purpose: 'Guard the first palm-canopy taco trail.' },
    { id: 'beach-upper-berry-moving-guard', anchorX: 7850, type: 'berry', count: 2, role: 'moving-guard', section: 'beach', purpose: 'Turn the leaf lift into a readable timing encounter.' },
    { id: 'beach-upper-mango-champion', anchorX: 9500, type: 'mango', count: 1, role: 'champion', section: 'beach', purpose: 'Cap the beach canopy route with a high-value target.' },
    { id: 'rooftops-upper-spaghetti-sentry', anchorX: 11850, type: 'spaghetti', count: 2, role: 'platform-sentry', section: 'rooftops', purpose: 'Make the first beat platform a discoverable risk-reward route.' },
    { id: 'rooftops-upper-pepper-moving-guard', anchorX: 13500, type: 'pepper', count: 1, role: 'moving-guard', section: 'rooftops', purpose: 'Place one readable guard on the moving roofline.' },
    { id: 'rooftops-upper-berry-sentry', anchorX: 15300, type: 'berry', count: 2, role: 'platform-sentry', section: 'rooftops', purpose: 'Carry the optional route toward the rooftop exit.' },
    { id: 'stampede-upper-pineapple-sentry', anchorX: 17650, type: 'pineapple', count: 2, role: 'platform-sentry', section: 'stampede', purpose: 'Guard the first speaker-stack climb.' },
    { id: 'stampede-upper-pepper-moving-guard', anchorX: 19400, type: 'pepper', count: 2, role: 'moving-guard', section: 'stampede', purpose: 'Make the speaker lift a controlled two-stomp timing test.' },
    { id: 'lagoon-upper-spaghetti-champion', anchorX: 21200, type: 'spaghetti', count: 1, role: 'champion', section: 'lagoon', purpose: 'Reward the suspended rehearsal route before Olivia’s catamaran arrives.' },
    { id: 'lagoon-upper-mango-sentry', anchorX: 22950, type: 'mango', count: 2, role: 'platform-sentry', section: 'lagoon', purpose: 'Offer optional combat above the clear catamaran lane.' },
    { id: 'lagoon-upper-berry-moving-guard', anchorX: 24450, type: 'berry', count: 2, role: 'moving-guard', section: 'lagoon', purpose: 'Turn the leaf lift into a risk-reward taco catch route.' },
    { id: 'lagoon-upper-pineapple-champion', anchorX: 26000, type: 'pineapple', count: 1, role: 'champion', section: 'lagoon', purpose: 'Place one premium target above Olivia’s rear taco volleys.' },
    { id: 'lagoon-upper-spaghetti-sentry', anchorX: 27350, type: 'spaghetti', count: 2, role: 'platform-sentry', section: 'lagoon', purpose: 'Close the optional lagoon route before the radio checkpoint.' },
  ]);
  const band = [
    { name: 'NOVA', role: 'VOCALS', color: '#ff4fac' },
    { name: 'JET', role: 'GUITAR', color: '#50e7ff' },
    { name: 'MILO', role: 'BASS', color: '#a4f766' },
    { name: 'ARMAN', role: 'KEYS', color: '#ffd65a' },
    { name: 'REX', role: 'DRUMS', color: '#b780ff' },
  ];
  const concertBandOrder = [1, 2, 0, 3, 4];

  const tracks = {
    soundcheck: document.getElementById('musicSoundcheck'),
    rooftops: document.getElementById('musicRooftops'),
    stampede: document.getElementById('musicStampede'),
    lagoon: document.getElementById('musicLagoon'),
    powerup: document.getElementById('musicPowerup'),
    concert: document.getElementById('musicConcert'),
  };
  const preConcertTracks = Object.entries(tracks).filter(([name]) => name !== 'concert').map(([, track]) => track);
  const allTracks = Object.values(tracks);
  const keys = { left: false, right: false, jump: false, lastDir: 1 };
  const inputSources = {
    keyboard: { left: false, right: false, jump: false },
    controller: { left: false, right: false, jump: false },
    touch: { left: new Set(), right: new Set(), jump: new Set() },
  };
  const images = {};
  const midgroundPanelCache = {};
  const terrainSpriteFrames = {
    soundcheck: [16, 456, 288, 159],
    beach: [314, 456, 276, 161],
    rooftops: [1370, 477, 286, 137],
    stampede: [1127, 451, 238, 165],
    lagoon: [598, 497, 246, 116],
    powerup: [855, 493, 261, 121],
    victory: [1370, 477, 286, 137],
  };
  const midgroundFrames = {
    village: [90, 91, 1356, 244],
    lagoon: [90, 399, 1356, 238],
    concert: [90, 701, 1356, 240],
  };
  const nearSceneryFrames = {
    soundcheck: [0, 0, 390, 520],
    beach: [390, 0, 455, 520],
    rooftops: [845, 0, 435, 520],
    stampede: [1280, 0, 413, 520],
    lagoon: [0, 520, 550, 409],
    powerup: [550, 520, 560, 409],
    victory: [1110, 520, 583, 409],
  };
  const nearSceneryBottomInsets = {
    soundcheck: 19,
    beach: 24,
    rooftops: 28,
    stampede: 31,
    lagoon: 30,
    powerup: 28,
    victory: 34,
  };
  const fanSpriteFrames = [
    [23, 595, 128, 233], [161, 611, 166, 219], [305, 608, 167, 222],
    [521, 604, 119, 223], [656, 597, 150, 230], [858, 588, 121, 239],
    [1008, 609, 116, 216], [1154, 600, 124, 227], [1312, 594, 139, 237],
    [1498, 605, 127, 220],
  ];
  const concertAudienceGrid = { columns: 6, rows: 2 };
  const concertAudience = [
    { count: 13, startX: 10, gap: 78, baseY: 454, scale: .76, phase: .2 },
    { count: 12, startX: 36, gap: 82, baseY: 487, scale: .9, phase: 1.35 },
    { count: 11, startX: 4, gap: 94, baseY: 526, scale: 1.04, phase: 2.5 },
  ].flatMap((row, rowIndex) => Array.from({ length: row.count }, (_, column) => ({
    x: row.startX + column * row.gap + (column % 3 - 1) * 4,
    baseY: row.baseY,
    scale: row.scale,
    row: rowIndex,
    phase: row.phase + column * .63,
    sprite: (column * 5 + rowIndex * 3) % 12,
    mirror: (column + rowIndex) % 2 === 0 ? 1 : -1,
    skin: ['#f0bd95', '#a76b48', '#d98f68', '#70462f', '#c7855f', '#f2c9aa'][(column + rowIndex * 2) % 6],
    shirt: ['#ff4fac', '#50e7ff', '#a4f766', '#ffd65a', '#b780ff', '#ff835c'][(column * 2 + rowIndex) % 6],
    hair: ['#2b1a2c', '#6c3827', '#171d35', '#9a562e', '#332022', '#d9a24f'][(column + rowIndex * 3) % 6],
  })));
  const world = {
    platforms: [], tacos: [], enemies: [], checkpoints: [], generators: [], generatorDefenses: [],
    fans: [], bandCameos: [], phase2Stations: [], bassPads: [],
  };

  function createWorld23Phase2State() {
    return {
      toast: null,
      secretBanner: null,
      groundCameoSeen: false,
      preShowHidden: false,
      completedIds: [],
      concertFallbackSystems: [],
    };
  }

  function createFeedbackFiendState() {
    return {
      phase: 'dormant', phaseTimer: 0, health: FEEDBACK_FIEND_MAX_HEALTH,
      maxHealth: FEEDBACK_FIEND_MAX_HEALTH, attackCycle: 0, invulnerable: 0,
      shockwaves: [], feedbackDrops: [], cableSweep: null,
      startedAt: 0, defeatedAt: 0, hitsTaken: 0, retryCount: 0,
      defeated: false, gateOpen: false, rewardSpawned: false,
      lastAttack: null, normalEvadeWindows: true,
    };
  }

  function createCableCrawlerState() {
    return {
      phase: 'dormant', phaseTimer: 0,
      health: CABLE_CRAWLER_MAX_HEALTH, maxHealth: CABLE_CRAWLER_MAX_HEALTH,
      attackCycle: 0, invulnerable: 0, sweep: null, plugTargets: [],
      triggered: false, announced: false, defeated: false, rewardSpawned: false,
      utilityPowered: false, concertFallbackPowered: false,
      hitsTaken: 0, retryCount: 0, defeatedAt: 0, lastAttack: null,
    };
  }
  const player = {
    x: 130, y: 370, w: 36, h: 44, vx: 0, vy: 0, dir: 1, grounded: false,
    platform: null, coyote: 0, jumpBuffer: 0, invulnerable: 0, rotation: 0, scale: 1,
    anim: 0,
  };
  const game = {
    state: 'title', score: 0, collected: 0, totalTacos: 0, golden: 0, totalGolden: 8,
    hearts: 3, energy: 0, cameraX: 0, levelTime: 0, startTime: 0, finishTime: 0,
    sectionIndex: 0, latestCheckpoint: null, message: '', messageTimer: 0,
    splatCombo: 0, splatTimer: 0, bestSplat: 0, abilities: abilities.createState(),
    confetti: [], particles: [], impactTexts: [],
    fireworks: [], cameraShake: 0, hitStop: 0, settingsOpen: false,
    muted: false, musicVolume: .7, effectsVolume: .8, reducedShake: false,
    activeMusic: null, musicTransition: null, respawn: heroCore.createRespawnState(),
    musicTransitionCount: 0, musicOverlapRecoveries: 0, maxMusicPlaying: 0,
    generators: 0,
    opening: {
      timer: 0, phase: 'loading', carX: OPENING_ROADSTER_X + 38,
      dustTimer: 0, finished: false,
    },
    pinata: { x: 31620, y: 338, hits: 0, exploded: false, wobble: 0, explosionTimer: 0 },
    boat: {
      active: false, x: 22600, timer: 0, dropTimer: 0, catches: 0,
      throwTimer: 0, throwCount: 0, pendingVolley: false, launchFlash: 0, departedAudio: false,
    },
    concert: {
      started: false, timer: 0, duration: 186.72, cueIndex: 0, items: [], collected: 0,
      platforms: [], chorusTacos: [], chorusVolleys: new Set(), cannonFlash: 0,
      controlRecoveries: 0, lastSafeX: 110, lastSafeY: 390,
      bowDone: false, songReady: false, entryReason: null, entryDecision: null,
      venueSystems: null,
    },
    personalBest: { score: 0, time: 0, energy: 0, runs: 0 },
    routeMaxGap: 0,
    respawnCount: 0, respawnFallbacks: 0, lastRespawnLanding: null,
    platformOverlapCount: 0,
    generatorDefenseAudit: null,
    phase2: createWorld23Phase2State(),
    cableCrawler: createCableCrawlerState(),
    boss: createFeedbackFiendState(),
  };

  let roadsterLoopHandle = null;
  let catamaranLoopHandle = null;
  let lastFrame = 0;
  let seed = 0x23C0FFEE;
  const params = new URLSearchParams(location.search);
  const qaMode = ['terminal.local', '127.0.0.1', 'localhost'].includes(location.hostname);
  const previewStart = qaMode ? Number(params.get('startX') || 0) : 0;
  const previewStartY = qaMode && params.has('startY')
    ? Number(params.get('startY')) : Number.NaN;
  const previewConcert = qaMode && params.get('concert') === '1';
  const previewConcertTime = qaMode ? Number(params.get('concertTime') || 0) : 0;
  const previewAutoRun = qaMode && params.get('autoRun') === '1';
  const previewSuper = qaMode && params.get('super') === '1';
  const previewRespawn = qaMode && params.get('respawn') === '1';
  const previewRespawnCheckpoint = qaMode ? Number(params.get('respawnCheckpoint') || -1) : -1;
  const previewPinataHits = qaMode
    ? Math.max(0, Math.min(2, Number(params.get('pinataHits') || 0)))
    : 0;
  const previewOpeningTime = qaMode
    ? Math.max(0, Number(params.get('openingTime') || 0))
    : 0;
  const previewBoatThrowProgress = qaMode && params.has('boatThrowProgress')
    ? Number(params.get('boatThrowProgress')) : Number.NaN;
  const previewEnergy = qaMode && params.has('energy')
    ? Number(params.get('energy')) : Number.NaN;
  const previewGolden = qaMode && params.has('golden')
    ? Number(params.get('golden')) : Number.NaN;
  const previewScore = qaMode && params.has('score')
    ? Number(params.get('score')) : Number.NaN;
  const previewCollected = qaMode && params.has('collected')
    ? Number(params.get('collected')) : Number.NaN;
  const previewBestSplat = qaMode && params.has('splats')
    ? Number(params.get('splats')) : Number.NaN;
  const previewGenerators = qaMode && params.has('generators')
    ? Number(params.get('generators')) : Number.NaN;
  const previewPhase2Complete = qaMode ? String(params.get('phase2Complete') || '') : '';
  const previewCableCrawler = qaMode && params.get('cableCrawler') === '1';
  const previewCableCrawlerHealth = qaMode && params.has('cableCrawlerHealth')
    ? Math.max(1, Math.min(CABLE_CRAWLER_MAX_HEALTH, Number(params.get('cableCrawlerHealth')))) : Number.NaN;
  const previewCableCrawlerPhase = qaMode ? String(params.get('cableCrawlerPhase') || '') : '';
  const previewCableCrawlerDefeated = qaMode && params.get('cableCrawlerDefeated') === '1';
  const previewBoss = qaMode && params.get('boss') === '1';
  const previewBossHealth = qaMode && params.has('bossHealth')
    ? Math.max(1, Math.min(FEEDBACK_FIEND_MAX_HEALTH, Number(params.get('bossHealth')))) : Number.NaN;
  const previewBossPhase = qaMode ? String(params.get('bossPhase') || '') : '';
  const previewBossDefeated = qaMode && params.get('bossDefeated') === '1';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const intersects = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const currentSection = (x = player.x) => sections.find((section) => x >= section.start && x < section.end) || sections.at(-1);
  const formatTime = (seconds) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds) % 60)).padStart(2, '0')}`;
  const smoothStep = (value) => {
    const progress = clamp(value, 0, 1);
    return progress * progress * (3 - 2 * progress);
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

  function screenAudioPosition(screenX) {
    return clamp((screenX / canvas.width) * 2 - 1, -1, 1);
  }

  function startRoadsterLoop(position = 0) {
    if (roadsterLoopHandle) return;
    roadsterLoopHandle = audio?.startLoop('vehicle.idle', { vehicleType: 'roadster', position }) || null;
  }

  function stopRoadsterLoop() {
    if (!roadsterLoopHandle) return;
    audio?.stopLoop(roadsterLoopHandle);
    roadsterLoopHandle = null;
  }

  function startCatamaranLoop(position = 0) {
    if (catamaranLoopHandle) return;
    catamaranLoopHandle = audio?.startLoop('vehicle.idle', { vehicleType: 'catamaran', position }) || null;
  }

  function stopCatamaranLoop() {
    if (!catamaranLoopHandle) return;
    audio?.stopLoop(catamaranLoopHandle);
    catamaranLoopHandle = null;
  }

  function getConcertEntryStatus() {
    const circuitsReady = game.generators === world.generators.length;
    const fullEnergy = game.energy >= CONCERT_ENCORE_ENERGY;
    const backstageReady = game.totalGolden > 0 && game.golden >= game.totalGolden;
    const encoreReady = circuitsReady || (fullEnergy && backstageReady);
    const bossReady = game.boss.defeated;
    return {
      routeReady: bossReady,
      encoreReady,
      reason: circuitsReady ? 'stage-circuits'
        : fullEnergy && backstageReady ? 'full-energy-backstage-encore' : 'main-route',
      circuitsReady,
      fullEnergy,
      backstageReady,
      bossReady,
    };
  }

  function resolveConcertEntry(playerX, score, entryStatus) {
    return {
      shouldStart: playerX >= CONCERT_ENTRY_TRIGGER_X && entryStatus.routeReady,
      entryReason: entryStatus.reason,
      routeReady: entryStatus.routeReady,
      encoreReady: entryStatus.encoreReady,
      score: Math.max(0, Math.floor(Number(score) || 0)),
      scoreRequirement: 0,
    };
  }

  function syncInputs() {
    keys.left = inputSources.keyboard.left || inputSources.controller.left || inputSources.touch.left.size > 0;
    keys.right = inputSources.keyboard.right || inputSources.controller.right || inputSources.touch.right.size > 0;
    keys.jump = inputSources.keyboard.jump || inputSources.controller.jump || inputSources.touch.jump.size > 0;
  }

  function setDigitalInput(source, input, down, pointerId = null) {
    if (!['left', 'right', 'jump'].includes(input) || !inputSources[source]) return;
    let wasPressed;
    if (source === 'touch') {
      const pointers = inputSources.touch[input];
      wasPressed = pointers.size > 0;
      if (down) pointers.add(pointerId);
      else pointers.delete(pointerId);
    } else {
      wasPressed = Boolean(inputSources[source][input]);
      inputSources[source][input] = down;
    }
    if (down && (input === 'left' || input === 'right')) keys.lastDir = input === 'right' ? 1 : -1;
    if (down && input === 'jump' && !wasPressed) player.jumpBuffer = heroPhysics.jumpBufferTime;
    syncInputs();
  }

  function clearInputs() {
    ['left', 'right', 'jump'].forEach((input) => {
      inputSources.keyboard[input] = false;
      inputSources.controller[input] = false;
    });
    Object.values(inputSources.touch).forEach((pointers) => pointers.clear());
    syncInputs();
    player.jumpBuffer = 0;
  }

  function getConcertOliviaRoutine(concertTime) {
    const supportY = 365 + Math.sin(concertTime * 1.9) * 3;
    if (concertTime < 30) return { phase: 'waiting', x: 125, supportY };
    if (concertTime < 47) {
      return {
        phase: 'surf-out',
        x: lerp(125, 835, smoothStep((concertTime - 30) / 17)),
        supportY,
      };
    }
    if (concertTime < 64) {
      return {
        phase: 'surf-back',
        x: lerp(835, 125, smoothStep((concertTime - 47) / 17)),
        supportY,
      };
    }
    if (concertTime < 68) return { phase: 'stage-cheer', x: 124, supportY };
    if (concertTime < 142) return { phase: 'taco-tambourine', x: 124, supportY };
    const danceOffset = player.x < canvas.width / 2 ? 104 : -104;
    return {
      phase: 'ground-dance',
      x: clamp(player.x + danceOffset, 86, canvas.width - 86),
      supportY: GROUND_Y,
    };
  }

  function addPlatform(x, y, w, style, extra = {}) {
    const platform = { x, y, w, h: extra.h || 24, style, dx: 0, dy: 0, ...extra };
    if (platform.moving) { platform.baseX = x; platform.baseY = y; }
    world.platforms.push(platform);
    return platform;
  }

  function ensureGeneratorDefensePlatform(generator, plan) {
    const defenderWidth = 48;
    const edgePadding = 24;
    const padStart = generator.x + Math.min(...plan.offsets) - edgePadding;
    const padEnd = generator.x + Math.max(...plan.offsets) + defenderWidth + edgePadding;
    const platformId = `generator-pad-${generator.id}`;
    const existing = world.platforms.find((platform) => (
      platform.ground
      && Math.abs(platform.y - GROUND_Y) < 1
      && platform.x <= padStart
      && platform.x + platform.w >= padEnd
    ));

    if (existing) {
      existing.id ||= platformId;
      existing.generatorPad = true;
      existing.mainRoute = true;
      return existing;
    }

    // The generated lower route can put a stage tower at the lip of a ground
    // segment. Carve one continuous defense pad into that route instead of
    // stacking an overlapping platform or handing addPlatform an object in
    // place of its positional geometry arguments. The latter produced NaN
    // platform coordinates and stopped the first render after the terrain.
    const rebuilt = [];
    for (const platform of world.platforms) {
      const platformEnd = platform.x + platform.w;
      const overlapsPad = platform.ground
        && Math.abs(platform.y - GROUND_Y) < 1
        && platform.x < padEnd
        && platformEnd > padStart;
      if (!overlapsPad) {
        rebuilt.push(platform);
        continue;
      }

      const leftWidth = padStart - platform.x;
      if (leftWidth > 1) {
        platform.w = leftWidth;
        rebuilt.push(platform);
      }
      const rightWidth = platformEnd - padEnd;
      if (rightWidth > 1) {
        const rightFragment = { ...platform, x: padEnd, w: rightWidth };
        if (rightFragment.id) rightFragment.id = `${rightFragment.id}-after-${generator.id}`;
        rebuilt.push(rightFragment);
      }
    }
    world.platforms = rebuilt;

    return addPlatform(padStart, GROUND_Y, padEnd - padStart, currentSection(generator.x).id, {
      id: platformId,
      h: 90,
      ground: true,
      mainRoute: true,
      generatorPad: true,
    });
  }

  function addTaco(x, y, type = 'taco', extra = {}) {
    const premium = type === 'golden' || type === 'rainbow';
    world.tacos.push({
      x, y, w: premium ? 30 : 24, h: premium ? 30 : 24,
      type, collected: false, bob: random() * Math.PI * 2, ...extra,
    });
  }

  function addLine(x, y, count, gap = 40, type = 'taco') {
    for (let i = 0; i < count; i += 1) addTaco(x + i * gap, y, type, { bob: i * .32 });
  }

  function addArc(x, y, count, gap = 36, height = 72, type = 'taco') {
    for (let i = 0; i < count; i += 1) {
      const progress = i / Math.max(1, count - 1);
      addTaco(x + i * gap, y - Math.sin(progress * Math.PI) * height, type, { bob: progress * 2 });
    }
  }

  function buildWorld23AuthoredRoutes() {
    const authoredPlatforms = [];
    const routeGroups = [];
    sections.slice(0, 5).forEach((section) => {
      const pattern = world23RoutePatterns[section.id];
      if (!pattern) return;
      for (let base = section.start + 680, group = 0; base < section.end - 1100; base += 1460, group += 1) {
        const groupStart = base + Math.min(...pattern.map((definition) => definition.dx));
        const groupEnd = base + Math.max(...pattern.map((definition) => definition.dx + definition.w));
        const reservedForPhase2 = WORLD23_PHASE2_PROTECTED_RANGES.some((range) => (
          groupStart < range.end && groupEnd > range.start
        ));
        if (reservedForPhase2) continue;
        const routeGroupId = `${section.id}-route-${group + 1}`;
        const groupPlatforms = pattern.map((definition, routeIndex) => {
          const platform = addPlatform(
            base + definition.dx,
            definition.y,
            definition.w,
            `${section.id}-${definition.kind}`,
            {
              id: `${routeGroupId}-${routeIndex + 1}`,
              upper: true,
              authoredRoute: true,
              routeGroupId,
              routeAct: section.id,
              routeKind: definition.kind,
              routeOrder: routeIndex,
              routeSummit: Boolean(definition.summit),
              moving: Boolean(definition.moving),
              axis: definition.axis || 'y',
              range: definition.range || 0,
              speed: 1.02 + group * .07,
              phase: group * .83 + routeIndex * .31,
              enemySupport: true,
            },
          );
          authoredPlatforms.push(platform);
          const tacoCount = clamp(Math.floor((platform.w - 28) / 46), 2, 4);
          addLine(
            platform.x + Math.max(20, (platform.w - (tacoCount - 1) * 42) / 2),
            platform.y - 45,
            tacoCount,
            42,
          );
          if (platform.routeSummit) {
            addTaco(platform.x + platform.w / 2 - 15, platform.y - 92, 'rainbow', {
              routeReward: true,
              routeGroupId,
            });
          }
          return platform;
        });
        routeGroups.push({ id: routeGroupId, section: section.id, platforms: groupPlatforms });
      }
    });

    const routeGaps = routeGroups.flatMap((group) => {
      const ordered = [...group.platforms].sort((a, b) => a.x - b.x);
      return ordered.slice(1).map((platform, index) => ({
        horizontal: platform.x - (ordered[index].x + ordered[index].w),
        vertical: Math.abs(platform.y - ordered[index].y),
      }));
    });
    game.world23RouteAudit = {
      sourceVersion: SOURCE_VERSION,
      authoredActs: new Set(routeGroups.map((group) => group.section)).size,
      routeGroups: routeGroups.length,
      authoredPlatforms: authoredPlatforms.length,
      movingRoutePlatforms: authoredPlatforms.filter((platform) => platform.moving).length,
      summitRewards: authoredPlatforms.filter((platform) => platform.routeSummit).length,
      maximumStepGap: Math.max(0, ...routeGaps.map((gap) => gap.horizontal)),
      maximumStepRise: Math.max(0, ...routeGaps.map((gap) => gap.vertical)),
      safeLowerRoutePreserved: true,
      optionalElevatedRoute: true,
    };
    return authoredPlatforms;
  }

  function buildWorld23Phase2Exploration() {
    const groundSegments = world.platforms.filter((platform) => (
      platform.ground
      && Math.abs(platform.y - GROUND_Y) < 1
      && platform.x < MARQUEE_GROUND_FOUNDATION.endX
      && platform.x + platform.w > MARQUEE_GROUND_FOUNDATION.startX
    ));
    const coveredStart = Math.min(...groundSegments.map((platform) => platform.x));
    const coveredEnd = Math.max(...groundSegments.map((platform) => platform.x + platform.w));
    const sortedGroundSegments = [...groundSegments].sort((a, b) => a.x - b.x);
    const gapsBefore = sortedGroundSegments.slice(1).map((platform, index) => Math.max(
      0,
      platform.x - (sortedGroundSegments[index].x + sortedGroundSegments[index].w),
    )).filter((gap) => gap > 0);
    world.platforms = world.platforms.filter((platform) => !groundSegments.includes(platform));
    const marqueeFoundation = addPlatform(coveredStart, GROUND_Y, coveredEnd - coveredStart, 'soundcheck', {
      id: 'marquee-ground-foundation',
      h: 90,
      ground: true,
      mainRoute: true,
      marqueeFoundation: true,
    });

    // The former Roadie Rooftops landmark stopped above several generated
    // route gaps. Absorb only the ground segments beneath this station into
    // one continuous venue foundation so the new loading wing and rehearsal
    // tower carry their weight all the way to collision-backed terrain.
    const roadieGroundSegments = world.platforms.filter((platform) => (
      platform.ground
      && Math.abs(platform.y - GROUND_Y) < 1
      && platform.x < ROADIE_ROOFTOPS_STRUCTURE.endX
      && platform.x + platform.w > ROADIE_ROOFTOPS_STRUCTURE.startX
    ));
    const roadieCoveredStart = Math.min(...roadieGroundSegments.map((platform) => platform.x));
    const roadieCoveredEnd = Math.max(...roadieGroundSegments.map((platform) => platform.x + platform.w));
    const roadieFoundationStart = Math.min(roadieCoveredStart, ROADIE_ROOFTOPS_STRUCTURE.startX);
    const roadieFoundationEnd = Math.max(roadieCoveredEnd, ROADIE_ROOFTOPS_STRUCTURE.endX);
    const roadieSortedGround = [...roadieGroundSegments].sort((a, b) => a.x - b.x);
    const roadieGapsBefore = roadieSortedGround.slice(1).map((platform, index) => Math.max(
      0,
      platform.x - (roadieSortedGround[index].x + roadieSortedGround[index].w),
    )).filter((gap) => gap > 0);
    world.platforms = world.platforms.filter((platform) => !roadieGroundSegments.includes(platform));
    const roadieFoundation = addPlatform(
      roadieFoundationStart,
      GROUND_Y,
      roadieFoundationEnd - roadieFoundationStart,
      'rooftops',
      {
        id: 'roadie-rooftops-ground-foundation',
        h: 90,
        ground: true,
        mainRoute: true,
        roadieRooftopsFoundation: true,
      },
    );

    world.phase2Stations = WORLD23_PHASE2_STATIONS.map((definition) => ({
      ...definition,
      completed: false,
      activatedAt: 0,
      progress: 0,
      dialogueTimer: 0,
      dialoguePlayed: false,
      rewardSpawned: false,
      platformIds: [],
    }));
    world.bassPads.length = 0;

    world.phase2Stations.forEach((station) => {
      station.platforms.forEach((definition, index) => {
        const platform = addPlatform(definition.x, definition.y, definition.w, `phase2-${definition.kind}`, {
          id: `phase2-${station.id}-${index + 1}`,
          h: definition.secret ? 30 : 26,
          upper: true,
          phase2StationId: station.id,
          phase2Style: definition.kind,
          phase2RouteShape: definition.routeShape || null,
          phase2Summit: Boolean(definition.summit),
          phase2Secret: Boolean(definition.secret),
          bassPad: Boolean(definition.bassPad),
          enemySupport: false,
          moving: Boolean(definition.moving),
          axis: definition.axis || 'y',
          range: definition.range || 0,
          speed: definition.speed || .72,
          phase: definition.phase || index * .47,
        });
        station.platformIds.push(platform.id);
        if (platform.bassPad) {
          platform.lastLaunchCycle = -1;
          world.bassPads.push(platform);
        }
        if (!definition.secret) {
          const tacoCount = Math.max(2, Math.min(4, Math.floor((platform.w - 34) / 54)));
          addLine(
            platform.x + Math.max(22, (platform.w - (tacoCount - 1) * 44) / 2),
            platform.y - 43,
            tacoCount,
            44,
          );
        }
      });
    });

    // One small shimmer leads curious players beyond the obvious catwalk. It
    // previews the hidden jump without drawing a secret banner over the route.
    addTaco(29492, 174, 'rainbow', { phase2Clue: 'encore-stash' });
    game.world23Phase2Audit = {
      sourceVersion: SOURCE_VERSION,
      visibleDestinations: WORLD23_PHASE2_VISIBLE_IDS.length,
      hiddenSecrets: world.phase2Stations.filter((station) => station.secret).length,
      stationIds: world.phase2Stations.map((station) => station.id),
      traversalProfiles: Object.fromEntries(world.phase2Stations.map((station) => [
        station.id, station.traversal || 'secret-destination',
      ])),
      approximatePlacement: Object.fromEntries(world.phase2Stations.map((station) => [
        station.id,
        Number(((station.start + station.end) / 2 / WORLD_WIDTH).toFixed(3)),
      ])),
      majorViewportSeparation: [
        WORLD23_PHASE2_STATIONS[1].start - WORLD23_PHASE2_STATIONS[0].end,
        WORLD23_PHASE2_STATIONS[2].start - WORLD23_PHASE2_STATIONS[1].end,
        WORLD23_PHASE2_STATIONS[3].start - WORLD23_PHASE2_STATIONS[2].end,
      ],
      safeDropToMainRoute: true,
      normalRouteRequired: false,
      repeatedFivePlatformStaircases: 0,
      movingStationPlatforms: world.platforms.filter((platform) => platform.phase2StationId && platform.moving).length,
      stationGeometry: Object.fromEntries(world.phase2Stations.map((station) => [
        station.id,
        {
          platformCount: station.platforms.length,
          movingCount: station.platforms.filter((platform) => platform.moving).length,
          horizontalSpan: station.end - station.start,
          verticalSpread: Math.max(...station.platforms.map((platform) => platform.y))
            - Math.min(...station.platforms.map((platform) => platform.y)),
          ySequence: station.platforms.map((platform) => platform.y),
          routeShapes: station.platforms.map((platform) => platform.routeShape || null),
        },
      ])),
      marqueeArchitecture: {
        unifiedWelcomeArch: true,
        singleMarqueeIdentity: true,
        oldMarqueeLayersRendered: 0,
        stageDecks: 0,
        groundedFootings: true,
        groundedCheckInHuts: true,
        premiumWelcomeBooth: true,
        welcomeBoothRoofCollisionY: MARQUEE_WELCOME_BOOTH.roofCollisionY,
        welcomeBoothSignIntegrated: true,
        continuousGroundFoundation: true,
        foundationStartX: marqueeFoundation.x,
        foundationEndX: marqueeFoundation.x + marqueeFoundation.w,
        absorbedGroundSegments: groundSegments.length,
        closedGroundGaps: gapsBefore,
        closedGroundGapWidth: gapsBefore.reduce((total, gap) => total + gap, 0),
        supportTowers: 2,
        crossBracing: true,
        lowerCrossConnection: true,
        upperMaintenanceCatwalks: 1,
        collisionMatchedCustomSurfaces: true,
        genericPlatformBaseSuppressed: true,
        serviceLiftRange: 120,
        majorSuperGap: 260,
        safeDropToMainRoute: true,
      },
      roadieRooftopsArchitecture: {
        oldFloatingLandmarkRendered: 0,
        oldGenericPlatformKindsRendered: 0,
        unifiedGroundedVenueBuilding: true,
        premiumLoadingAnnex: true,
        premiumVenueTower: true,
        fullWallsToTerrain: true,
        continuousGroundFoundation: true,
        foundationStartX: roadieFoundation.x,
        foundationEndX: roadieFoundation.x + roadieFoundation.w,
        absorbedGroundSegments: roadieGroundSegments.length,
        closedGroundGaps: roadieGapsBefore,
        closedGroundGapWidth: roadieGapsBefore.reduce((total, gap) => total + gap, 0),
        structureFootprintFullySupported: roadieFoundation.x <= ROADIE_ROOFTOPS_STRUCTURE.startX
          && roadieFoundation.x + roadieFoundation.w >= ROADIE_ROOFTOPS_STRUCTURE.endX,
        loadingBay: true,
        maintenanceLevels: 3,
        venueSourceDimensions: [
          ROADIE_ROOFTOPS_STRUCTURE.venueSourceWidth,
          ROADIE_ROOFTOPS_STRUCTURE.venueSourceHeight,
        ],
        previousVenueDrawDimensions: [
          ROADIE_ROOFTOPS_STRUCTURE.previousBuildingDrawWidth,
          ROADIE_ROOFTOPS_STRUCTURE.previousBuildingDrawHeight,
        ],
        previousVenueCropFraction: ROADIE_ROOFTOPS_STRUCTURE.previousVenueCropFraction,
        correctedVenueDrawDimensions: [
          ROADIE_ROOFTOPS_STRUCTURE.buildingDrawWidth,
          ROADIE_ROOFTOPS_STRUCTURE.buildingDrawHeight,
        ],
        venueSourceAspect: Number((
          ROADIE_ROOFTOPS_STRUCTURE.venueSourceWidth / ROADIE_ROOFTOPS_STRUCTURE.venueSourceHeight
        ).toFixed(4)),
        correctedVenueDisplayAspect: Number((
          ROADIE_ROOFTOPS_STRUCTURE.buildingDrawWidth / ROADIE_ROOFTOPS_STRUCTURE.buildingDrawHeight
        ).toFixed(4)),
        venueSourceAspectPreserved: Math.abs(
          ROADIE_ROOFTOPS_STRUCTURE.buildingDrawWidth / ROADIE_ROOFTOPS_STRUCTURE.buildingDrawHeight
          - ROADIE_ROOFTOPS_STRUCTURE.venueSourceWidth / ROADIE_ROOFTOPS_STRUCTURE.venueSourceHeight
        ) < .002,
        fullVenueSourceRendered: true,
        modularUtilitySupports: 2,
        serviceClusterArtVersion: 'world2_3_roadie_service_cluster_v1',
        centralEquipmentBuildingName: ROADIE_SERVICE_CLUSTER.equipmentName,
        dimensionalEquipmentRoom: true,
        dimensionalVentService: true,
        ventFanAnimation: 'restrained-powered-rotation',
        freightCageArtVersion: 'world2_3_roadie_freight_cage_v1',
        freightLiftMechanicsPreserved: true,
        crawlerServiceDeckSupportedByEquipmentRoom: true,
        routeGeometryChanged: false,
        performerPlacementChanged: false,
        finalBuildingVisualHeight: ROADIE_ROOFTOPS_STRUCTURE.buildingDrawHeight,
        finalBuildingVisualWidth: ROADIE_ROOFTOPS_STRUCTURE.buildingDrawWidth,
        routeVerticalRise: GROUND_Y - ROADIE_ROOFTOPS_STRUCTURE.rehearsalDeckY,
        targetTraversalSeconds: [18, 25],
        customTraversalSurfaceCount: WORLD23_PHASE2_STATIONS[1].platforms.length,
        freightLiftRange: 160,
        singleBassLaunch: true,
        customTrussTransfer: true,
        finalSuperJump: true,
        premiumMiloAlpha: true,
        premiumRexAlpha: true,
        miloCenterX: 14030,
        rexCenterX: 14330,
        performerSpeakerOverlap: false,
        rewardAboveRehearsalRoof: WORLD23_PHASE2_STATIONS[1].reward.y
          < ROADIE_ROOFTOPS_STRUCTURE.rehearsalDeckY,
        collisionMatchedCustomSurfaces: true,
        genericPlatformBaseSuppressed: true,
        safeDropToMainRoute: true,
        cableCrawler: {
          optional: true,
          maxHealth: CABLE_CRAWLER_MAX_HEALTH,
          attacks: ['cable-sweep', 'power-plug-pop'],
          damageMethod: 'three-stomps-on-exposed-core',
          blocksMainRoute: false,
          replacesFeedbackFiend: false,
        },
      },
      catamaranIsolation: {
        stationEnd: world23Phase2Station('lagoon')?.end || 0,
        catamaranStart: 22800,
        buffer: 22800 - (world23Phase2Station('lagoon')?.end || 22800),
        overlap: (world23Phase2Station('lagoon')?.end || 0) >= 22800,
        triggerToCatamaran: 22800 - (world23Phase2Station('lagoon')?.trigger.x || 22800),
        dialogueDurationSeconds: 3.2,
        dialogueClearanceAtRunSpeedSeconds: Number((
          (22800 - (world23Phase2Station('lagoon')?.trigger.x || 22800)) / 310 - 3.2
        ).toFixed(2)),
      },
      crowdIsolation: {
        stationEnd: world23Phase2Station('golden')?.end || 0,
        bossArenaRight: FEEDBACK_FIEND_ARENA.right,
        crowdStart: 34020,
        bossToCrowdBuffer: 34020 - FEEDBACK_FIEND_ARENA.right,
      },
      secretBannerReservedFor: 'encore',
      casualRoster: ['NOVA', 'JET', 'MILO', 'ARMAN', 'REX'],
    };
  }

  function world23GroundSupport(anchorX) {
    const candidates = world.platforms
      .filter((platform) => platform.ground && platform.mainRoute && !platform.generatorPad)
      .filter((platform) => platform.x < WORLD23_ORDINARY_COMBAT_END)
      .filter((platform) => !(
        platform.x < WORLD23_CATAMARAN_CLEAR_CORRIDOR.end
        && platform.x + platform.w > WORLD23_CATAMARAN_CLEAR_CORRIDOR.start
      ));
    const containing = candidates.find((platform) => (
      anchorX >= platform.x + 68 && anchorX <= platform.x + platform.w - 68
    ));
    return containing || candidates
      .slice()
      .sort((a, b) => Math.abs(a.x + a.w / 2 - anchorX) - Math.abs(b.x + b.w / 2 - anchorX))[0] || null;
  }

  function world23UpperSupport(definition, usedPlatformIds) {
    const requestedCount = Math.max(1, Math.floor(Number(definition.count) || 1));
    return world.platforms
      .filter((platform) => platform.authoredRoute && platform.routeAct === definition.section)
      .filter((platform) => !usedPlatformIds.has(platform.id))
      .filter((platform) => requestedCount === 1 || platform.w >= 190)
      .filter((platform) => definition.role !== 'moving-guard' || platform.moving)
      .sort((a, b) => Math.abs(a.x + a.w / 2 - definition.anchorX) - Math.abs(b.x + b.w / 2 - definition.anchorX))[0] || null;
  }

  function createWorld23PatrolZone(platform, definition, occurrence, totalOccurrences) {
    const zoneWidth = Math.min(440, Math.max(270, Math.floor((platform.w - 32) / Math.max(1, totalOccurrences) - 22)));
    const minX = platform.x + 16;
    const maxX = platform.x + platform.w - zoneWidth - 16;
    return {
      ...platform,
      id: `${platform.id || definition.section}-patrol-zone-${occurrence + 1}`,
      x: clamp(definition.anchorX - zoneWidth / 2, minX, Math.max(minX, maxX)),
      w: zoneWidth,
      virtualPatrolZone: true,
      physicalSupportPlatformId: platform.id || null,
    };
  }

  function addWorld23Formation(definition, platform) {
    if (!platform) return [];
    const enemyWidth = 48;
    const enemyHeight = 54;
    const requestedCount = Math.max(1, Math.floor(Number(definition.count) || 1));
    const groupingAllowed = Boolean(platform.ground) || platform.w >= 190;
    const count = groupingAllowed ? requestedCount : 1;
    const spacing = count > 1
      ? Math.max(enemyWidth + 12, Number(definition.spacing) || enemyWidth + 18)
      : enemyWidth + 14;
    const formationWidth = enemyWidth + (count - 1) * spacing;
    const leftEdge = platform.x + 20;
    const rightEdge = platform.x + platform.w - formationWidth - 20;
    const requestedOffset = Number.isFinite(definition.offset)
      ? definition.offset
      : Math.max(0, (platform.w - formationWidth) / 2);
    const startX = clamp(platform.x + requestedOffset, leftEdge, Math.max(leftEdge, rightEdge));
    const role = definition.role || (platform.ground ? 'ground-patrol' : 'platform-sentry');
    const behaviorType = ({ berry: 'tomato', mango: 'jalapeno', spaghetti: 'onion', pepper: 'chili', pineapple: 'jalapeno' })[definition.type] || 'tomato';
    const enemies = heroCore.createEnemyFormation({
      id: definition.id,
      type: definition.type,
      startX,
      y: platform.y - enemyHeight,
      w: enemyWidth,
      h: enemyHeight,
      count,
      spacing,
      vx: role === 'moving-guard' ? 42 : role === 'champion' ? 38 : 40,
      patrolPadding: 16,
      role,
      roleExplicit: true,
      platform,
      platformId: platform.id,
      supportPlatformId: definition.physicalSupportPlatformId || platform.id,
      world23Encounter: definition.id,
      world23Section: definition.section,
      world23Purpose: definition.purpose,
      champion: role === 'champion',
      formationRule: groupingAllowed ? 'ground-or-large-platform' : 'single-narrow-platform',
      formationPurpose: definition.purpose,
    });
    enemies.forEach((enemy, index) => {
      enemy.behaviorType = behaviorType;
      enemy.dir = index % 2 === 0 ? 1 : -1;
      enemy.speed = role === 'moving-guard' ? 42 : role === 'champion' ? 38 : 40 + (index % 2) * 4;
      enemy.clock = ((world.enemies.length + index) * .19) % 3.2;
      enemy.previousY = enemy.y;
      heroCore.prepareEnemyBehavior(enemy, world.enemies.length + index, behaviorType);
      world.enemies.push(enemy);
    });
    return enemies;
  }

  function authorWorld23CombatEncounters() {
    world.enemies.length = 0;
    const authored = { ground: [], upper: [], skipped: [] };
    const supportCounts = new Map();
    const assignments = world23GroundEncounterPlan.map((definition) => ({
      definition,
      platform: world23GroundSupport(definition.anchorX),
    }));
    assignments.forEach(({ platform }) => {
      if (platform) supportCounts.set(platform, (supportCounts.get(platform) || 0) + 1);
    });
    const occurrences = new Map();
    assignments.forEach(({ definition, platform }) => {
      if (!platform) { authored.skipped.push(definition.id); return; }
      const totalOccurrences = supportCounts.get(platform) || 1;
      const occurrence = occurrences.get(platform) || 0;
      occurrences.set(platform, occurrence + 1);
      const patrolPlatform = totalOccurrences > 1
        ? createWorld23PatrolZone(platform, definition, occurrence, totalOccurrences)
        : platform;
      const count = Math.max(1, Math.floor(Number(definition.count) || 1));
      const spacing = totalOccurrences > 1 ? 86 : undefined;
      const formationWidth = 48 + (count - 1) * (spacing || 66);
      const offset = totalOccurrences > 1
        ? Math.max(20, (patrolPlatform.w - formationWidth) / 2)
        : Math.max(64, Math.min(platform.w - formationWidth - 26, definition.anchorX - platform.x - formationWidth / 2));
      const enemies = addWorld23Formation({
        ...definition,
        offset,
        spacing,
        role: 'ground-patrol',
        physicalSupportPlatformId: platform.id,
      }, patrolPlatform);
      enemies.forEach((enemy) => { enemy.physicalSupportPlatformId = platform.id || null; });
      if (enemies.length) authored.ground.push(definition.id);
    });

    const usedUpperPlatformIds = new Set();
    world23UpperEncounterPlan.forEach((definition) => {
      const platform = world23UpperSupport(definition, usedUpperPlatformIds);
      if (!platform) { authored.skipped.push(definition.id); return; }
      usedUpperPlatformIds.add(platform.id);
      const enemies = addWorld23Formation(definition, platform);
      if (enemies.length) authored.upper.push(definition.id);
    });

    game.world23CombatAuthored = {
      sourceVersion: SOURCE_VERSION,
      ordinaryCombatEnd: WORLD23_ORDINARY_COMBAT_END,
      authoredGroundEncounters: authored.ground.length,
      authoredUpperEncounters: authored.upper.length,
      skippedEncounterIds: authored.skipped,
      upperRoutePlatforms: [...usedUpperPlatformIds],
    };
  }

  function auditWorld23CombatRemaster(patrolAudit) {
    const grouped = new Map();
    world.enemies.forEach((enemy) => {
      if (!enemy.groupId) return;
      if (!grouped.has(enemy.groupId)) grouped.set(enemy.groupId, []);
      grouped.get(enemy.groupId).push(enemy);
    });
    const formationOverlapPairs = [];
    const mixedTypeGroups = [];
    const narrowPlatformGroups = [];
    grouped.forEach((members, groupId) => {
      const ordered = [...members].sort((a, b) => a.groupIndex - b.groupIndex || a.x - b.x);
      const support = ordered[0]?.platform;
      if (ordered.length > 1 && support && !support.ground && support.w < 190) narrowPlatformGroups.push(groupId);
      if (new Set(ordered.map((enemy) => enemy.type)).size > 1) mixedTypeGroups.push(groupId);
      for (let index = 0; index < ordered.length - 1; index += 1) {
        const left = ordered[index];
        const right = ordered[index + 1];
        if (left.x + left.w > right.x + .5 || left.maxX + left.w > right.minX + .5) {
          formationOverlapPairs.push(`${groupId}:${left.groupIndex}-${right.groupIndex}`);
        }
      }
    });
    const ordinaryEnemies = world.enemies.filter((enemy) => !enemy.defenseEncounter);
    const upperEnemies = ordinaryEnemies.filter((enemy) => !enemy.platform?.ground);
    const catamaranGroundEnemies = ordinaryEnemies.filter((enemy) => (
      enemy.platform?.ground
      && enemy.x >= WORLD23_CATAMARAN_CLEAR_CORRIDOR.start
      && enemy.x < WORLD23_CATAMARAN_CLEAR_CORRIDOR.end
    ));
    const defenseTypes = world.generatorDefenses.map((defense) => (
      world.enemies.find((enemy) => enemy.id === defense.enemyIds[0])?.type || null
    ));
    game.world23CombatAudit = {
      sourceVersion: SOURCE_VERSION,
      authoredGroundEncounters: game.world23CombatAuthored.authoredGroundEncounters,
      authoredUpperEncounters: game.world23CombatAuthored.authoredUpperEncounters,
      ordinaryEnemies: ordinaryEnemies.length,
      upperEnemies: upperEnemies.length,
      generatorDefenders: world.enemies.filter((enemy) => enemy.defenseEncounter).length,
      openingSafeZoneEnemies: ordinaryEnemies.filter((enemy) => enemy.x < WORLD23_OPENING_SAFE_END).length,
      catamaranGroundEnemies: catamaranGroundEnemies.length,
      ordinaryPowerupEnemies: ordinaryEnemies.filter((enemy) => enemy.x >= WORLD23_ORDINARY_COMBAT_END).length,
      victoryEnemies: world.enemies.filter((enemy) => enemy.x >= 33000).length,
      formationOverlapPairs,
      mixedTypeGroups,
      narrowPlatformGroups,
      allEnemiesPlatformBound: world.enemies.every((enemy) => Boolean(enemy.platform)),
      safeUpperLandingMargins: upperEnemies.every((enemy) => (
        enemy.minX >= enemy.platform.x + 28
        && enemy.maxX + enemy.w <= enemy.platform.x + enemy.platform.w - 28
      )),
      generatorDefenseTypes: defenseTypes,
      distinctGeneratorDefenses: new Set(defenseTypes.filter(Boolean)).size === world.generators.length,
      patrol: patrolAudit,
    };
  }

  function buildWorld() {
    seed = 0x23C0FFEE;
    Object.values(world).forEach((list) => { if (Array.isArray(list)) list.length = 0; });
    world.checkpoints = heroCore.createCheckpointSet(checkpointDefs, {
      defaults: { y: GROUND_Y - 126, w: 190, h: 126 },
    });
    world.generators = [
      { id: 'vocal-tower', x: 30100, y: 316, color: '#ff4fac', name: 'VOCAL TOWER', activated: false, defenseState: 'armed' },
      { id: 'instrument-tower', x: 31220, y: 316, color: '#50e7ff', name: 'INSTRUMENT TOWER', activated: false, defenseState: 'armed' },
      { id: 'rhythm-tower', x: 32150, y: 316, color: '#b780ff', name: 'RHYTHM TOWER', activated: false, defenseState: 'armed' },
    ];
    world.bandCameos = [
      {
        x: 4700, member: 0, casual: true, grounded: false,
        activity: 'carrying-microphone-case', dialogue: 'SEE YOU AT THE SHOW!',
      },
    ];

    // A guaranteed lower route. Gaps remain below the shared jump contract.
    for (const section of sections) {
      let x = section.start;
      let index = 0;
      while (x < section.end) {
        const length = section.id === 'victory' ? 620 : 430 + (index % 4) * 85;
        const gap = section.id === 'victory' ? 0 : 54 + (index % 3) * 18;
        const width = Math.min(length, section.end - x);
        addPlatform(x, GROUND_Y, width, section.id, { h: 90, ground: true, mainRoute: true });
        x += width + gap;
        index += 1;
      }
    }
    // Every checkpoint receives a continuous ground pad. When a generated
    // route segment already reaches it, extend that segment instead of
    // stacking a second platform on top.
    world.checkpoints.forEach((checkpoint) => {
      const padStart = checkpoint.x - 28;
      const padEnd = checkpoint.x + checkpoint.w + 28;
      const center = checkpoint.x + checkpoint.w / 2;
      const support = world.platforms.find((platform) => platform.ground
        && center >= platform.x && center <= platform.x + platform.w);
      if (support) {
        const supportEnd = support.x + support.w;
        support.x = Math.min(support.x, padStart);
        support.w = Math.max(supportEnd, padEnd) - support.x;
      } else {
        addPlatform(padStart, GROUND_Y, padEnd - padStart, currentSection(checkpoint.x).id, {
          h: 90, ground: true, mainRoute: true, checkpointPad: true,
        });
      }
      checkpoint.grounded = true;
    });
    // Every band cameo receives the same uninterrupted footing contract as a
    // checkpoint. This prevents a performer from being composed over one of
    // the generated lower-route gaps.
    world.bandCameos.forEach((cameo) => {
      const padStart = cameo.x - 42;
      const padEnd = cameo.x + 86;
      const center = cameo.x + 22;
      const support = world.platforms.find((platform) => platform.ground
        && center >= platform.x && center <= platform.x + platform.w);
      if (support) {
        const supportEnd = support.x + support.w;
        support.x = Math.min(support.x, padStart);
        support.w = Math.max(supportEnd, padEnd) - support.x;
      } else {
        addPlatform(padStart, GROUND_Y, padEnd - padStart, currentSection(cameo.x).id, {
          h: 90, ground: true, mainRoute: true, bandPad: true,
        });
      }
      cameo.grounded = true;
    });

    // Each pre-concert act now owns a distinct optional upper route rather
    // than inheriting one repeated five-step shape. The lower route remains
    // continuous and forgiving; these authored risers, canopies, rooftops,
    // speaker stacks, and lagoon leaves carry the risk-reward taco trail.
    buildWorld23AuthoredRoutes();
    buildWorld23Phase2Exploration();

    // Organized continuous taco guidance along the entire playable route.
    for (let x = 190; x < WORLD_WIDTH - 120; x += 44) {
      const section = currentSection(x);
      const wave = section.id === 'victory' ? Math.sin(x * .012) * 20 : Math.sin(x * .006) * 28;
      addTaco(x, GROUND_Y - 58 - wave);
    }
    [3900, 7900, 12200, 15800, 19900, 24600, 29700, 33800].forEach((x) => addTaco(x, 300, 'golden'));
    world.checkpoints.forEach((checkpoint) => addArc(checkpoint.x - 130, GROUND_Y - 54, 9, 34, 55));

    // Replace the old alternating singleton chain with authored same-type
    // encounters tied to the new route. Ground packs teach each act's rhythm;
    // upper sentries make the optional taco route visible. Olivia's catamaran
    // keeps a completely clear lower lane and the power act is reserved for
    // the three generator defenses below.
    authorWorld23CombatEncounters();

    // Stage power is a short optional defense encounter. Each tower gets a
    // visually distinct same-type group with its own color and rhythm. Clearing
    // them raises concert energy and records the strongest concert-entry reason,
    // while the main story route remains open. The later victory dash and the
    // concert itself remain enemy-free reward space.
    const generatorDefensePlans = [
      { generatorId: 'vocal-tower', label: 'VOCAL WARMUP', beat: 'CHORUS LINE', color: '#ff4fac', types: ['berry', 'berry', 'berry'], offsets: [-132, -42, 54] },
      { generatorId: 'instrument-tower', label: 'INSTRUMENT CHECK', beat: 'ARPEGGIO RUN', color: '#50e7ff', types: ['spaghetti', 'spaghetti', 'spaghetti'], offsets: [-126, -30, 66] },
      { generatorId: 'rhythm-tower', label: 'RHYTHM CHECK', beat: 'BACKBEAT DROP', color: '#b780ff', types: ['pepper', 'pepper', 'pepper'], offsets: [-138, -44, 50] },
    ];
    const defenseBehavior = { berry: 'tomato', mango: 'jalapeno', spaghetti: 'onion', pepper: 'chili', pineapple: 'jalapeno' };
    const defenseEnemies = [];
    generatorDefensePlans.forEach((plan) => {
      const generator = world.generators.find((candidate) => candidate.id === plan.generatorId);
      if (!generator) return;
      const support = ensureGeneratorDefensePlatform(generator, plan);
      generator.supportPlatformId = support.id;
      const defense = {
        generatorId: generator.id,
        label: plan.label,
        beat: plan.beat,
        color: plan.color,
        supportPlatformId: support.id,
        enemyIds: [],
      };
      plan.types.forEach((type, index) => {
        const x = generator.x + plan.offsets[index];
        const enemy = {
          id: `${generator.id}-defender-${index + 1}`,
          x, y: support.y - 54, baseY: support.y - 54,
          w: 48, h: 54, type, behaviorType: defenseBehavior[type],
          dir: index % 2 ? -1 : 1, speed: 36 + index * 6,
          minX: x - 30, maxX: x + 30, alive: true, splat: 0,
          platform: support, supportPlatformId: support.id, generatorId: generator.id,
          defenseEncounter: true, defenseLabel: plan.label,
          defenseBeat: plan.beat,
          defenseColor: plan.color, groupId: `${generator.id}-defense`, groupIndex: index,
          groupSize: plan.types.length, formationType: 'generator-defense',
        };
        heroCore.prepareEnemyBehavior(enemy, world.enemies.length + defenseEnemies.length, enemy.behaviorType);
        defense.enemyIds.push(enemy.id);
        defenseEnemies.push(enemy);
      });
      generator.defenseTotal = defense.enemyIds.length;
      generator.defenseState = 'armed';
      world.generatorDefenses.push(defense);
    });
    world.enemies.push(...defenseEnemies);
    game.generatorDefenseAudit = {
      sourceVersion: SOURCE_VERSION,
      level: '2-3',
      generators: world.generators.map((generator) => ({
        id: generator.id, defenseTotal: generator.defenseTotal,
        supportPlatformId: generator.supportPlatformId,
        label: world.generatorDefenses.find((defense) => defense.generatorId === generator.id)?.label || generator.name,
        beat: world.generatorDefenses.find((defense) => defense.generatorId === generator.id)?.beat || null,
      })),
      defenseEnemyCount: defenseEnemies.length,
      distinctDefenseTypes: new Set(defenseEnemies.map((enemy) => enemy.type)).size,
      preConcertDefenseRequired: false,
      concertRouteRequirement: 'none',
      optionalEncoreGoals: ['stage-circuits', 'full-energy-backstage-encore'],
      victoryEnemyFreeFrom: 33000,
      concertEnemyFree: true,
      finitePlatformGeometry: world.platforms.every((platform) => (
        Number.isFinite(platform.x)
        && Number.isFinite(platform.y)
        && Number.isFinite(platform.w)
        && Number.isFinite(platform.h)
      )),
    };

    game.platformEnemyStats = heroCore.attachEnemiesToPlatforms(world.enemies, world.platforms, {
      surfaceTolerance: 32,
      edgePadding: 14,
    });
    const patrolAudit = {
      ground: heroCore.retuneEnemyFormationPatrols(
        world.enemies.filter((enemy) => !enemy.defenseEncounter && enemy.platform?.ground),
        { fullPlatformCoverage: true, minimumGap: 12, edgePadding: 18 },
      ),
      upper: heroCore.retuneEnemyFormationPatrols(
        world.enemies.filter((enemy) => !enemy.defenseEncounter && !enemy.platform?.ground),
        { fullPlatformCoverage: true, minimumGap: 12, edgePadding: 30 },
      ),
      defenses: heroCore.retuneEnemyFormationPatrols(
        world.enemies.filter((enemy) => enemy.defenseEncounter),
        { fullPlatformCoverage: true, minimumGap: 10, edgePadding: 24 },
      ),
    };
    auditWorld23CombatRemaster(patrolAudit);

    for (let x = 34020, index = 0; x < 34760; x += 88, index += 1) {
      world.fans.push({
        x,
        message: fanChatLines[index % fanChatLines.length],
        color: band[index % band.length].color,
        look: index % 6,
        bubbleTier: index % 3,
        bubbleSide: index % 2 === 0 ? -1 : 1,
      });
    }

    world.platforms.sort((a, b) => a.x - b.x);
    let covered = 0;
    game.routeMaxGap = 0;
    world.platforms.filter((platform) => platform.mainRoute || platform.ground).forEach((platform) => {
      game.routeMaxGap = Math.max(game.routeMaxGap, platform.x - covered);
      covered = Math.max(covered, platform.x + platform.w);
    });
    game.routeMaxGap = Math.round(game.routeMaxGap);
    game.totalTacos = world.tacos.filter((item) => item.type === 'taco').length;
    game.totalGolden = world.tacos.filter((item) => item.type === 'golden').length;
    const elevated = world.platforms.filter((platform) => !platform.ground && !platform.concert);
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
  }

  function loadProgress() {
    try {
      const shared = JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}');
      const local = JSON.parse(localStorage.getItem('jumpinForTacosLevel23ProgressV1') || '{}');
      if (shared.settings) {
        game.musicVolume = clamp(Number(shared.settings.musicVolume ?? .7), 0, 1);
        game.effectsVolume = clamp(Number(shared.settings.effectsVolume ?? .8), 0, 1);
        game.reducedShake = Boolean(shared.settings.reducedShake);
        game.muted = Boolean(shared.settings.muted);
      }
      if (local.personalBest) game.personalBest = { ...game.personalBest, ...local.personalBest };
    } catch { /* Device storage is optional. */ }
  }

  function saveProgress() {
    try {
      const shared = JSON.parse(localStorage.getItem('jumpinForTacosProgressV2') || '{}');
      shared.settings = { musicVolume: game.musicVolume, effectsVolume: game.effectsVolume, reducedShake: game.reducedShake, muted: game.muted };
      localStorage.setItem('jumpinForTacosProgressV2', JSON.stringify(shared));
      localStorage.setItem('jumpinForTacosLevel23ProgressV1', JSON.stringify({ personalBest: game.personalBest }));
    } catch { /* Device storage is optional. */ }
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

  function updatePersonalBest() {
    const best = game.personalBest;
    ui.personalBestText.textContent = best.runs
      ? `Concert best: ${best.score.toLocaleString()} points • ${formatTime(best.time)} • ${best.energy}% energy`
      : 'Your first concert run sets the record!';
  }

  function resetGame() {
    stopRoadsterLoop();
    stopCatamaranLoop();
    buildWorld();
    Object.assign(game, {
      state: 'title', score: 0, collected: 0, golden: 0, hearts: 3, energy: 0,
      cameraX: 0, levelTime: 0, startTime: 0, finishTime: 0, sectionIndex: 0,
      latestCheckpoint: null, message: '', messageTimer: 0, splatCombo: 0, splatTimer: 0,
      bestSplat: 0, abilities: abilities.createState(),
      confetti: [], particles: [], impactTexts: [], fireworks: [], cameraShake: 0, hitStop: 0,
      settingsOpen: false, respawn: heroCore.createRespawnState(), generators: 0,
      activeMusic: null, musicTransition: null,
      musicTransitionCount: 0, musicOverlapRecoveries: 0, maxMusicPlaying: 0,
      phase2: createWorld23Phase2State(),
      cableCrawler: createCableCrawlerState(),
      boss: createFeedbackFiendState(),
      opening: {
        timer: 0, phase: 'loading', carX: OPENING_ROADSTER_X + 38,
        dustTimer: 0, finished: false,
      },
      pinata: { x: 31620, y: 338, hits: 0, exploded: false, wobble: 0, explosionTimer: 0 },
      boat: {
        active: false, x: 22600, timer: 0, dropTimer: 0, catches: 0,
        throwTimer: 0, throwCount: 0, pendingVolley: false, launchFlash: 0, departedAudio: false,
      },
      concert: {
        started: false, timer: 0, duration: 186.72, cueIndex: 0, items: [], collected: 0,
        platforms: [], chorusTacos: [], chorusVolleys: new Set(), cannonFlash: 0,
        controlRecoveries: 0, lastSafeX: 110, lastSafeY: 390,
        bowDone: false, songReady: false, skipped: false, skippedAt: 0,
        entryReason: null, entryDecision: null, venueSystems: null,
      },
      respawnCount: 0, respawnFallbacks: 0, lastRespawnLanding: null,
    });
    Object.assign(player, {
      x: 130, y: 370, vx: 0, vy: 0, dir: 1, grounded: false, platform: null,
      coyote: 0, jumpBuffer: 0, invulnerable: 0, rotation: 0, scale: 1,
    });
    if (previewSuper) {
      abilities.activateSuper(game.abilities, 'qa-preview', { silent: true });
      game.abilities.transformTimer = 0;
    }
    clearInputs();
    stopMusic();
    ui.startOverlay.classList.remove('hidden');
    ui.startOverlay.classList.add('visible');
    ui.winOverlay.classList.add('hidden');
    ui.winOverlay.classList.remove('visible');
    ui.skipConcertBtn.hidden = true;
  }

  function unlockAudio() {
    audio?.init({
      musicVolume: game.musicVolume,
      effectsVolume: game.effectsVolume,
      muted: game.muted,
    });
  }

  function showMessage(text, duration = 2.2) {
    game.message = text;
    game.messageTimer = duration;
  }

  function openingPhaseAt(timer) {
    if (timer < openingTimeline.loadingEnd) return 'loading';
    if (timer < openingTimeline.boardingEnd) return 'boarding';
    if (timer < openingTimeline.revvingEnd) return 'revving';
    if (timer < openingTimeline.departingEnd) return 'departing';
    return 'finished';
  }

  function openingCarXAt(timer) {
    if (timer < openingTimeline.revvingEnd) return OPENING_ROADSTER_X + 38;
    const progress = clamp(
      (timer - openingTimeline.revvingEnd)
        / (openingTimeline.departingEnd - openingTimeline.revvingEnd),
      0,
      1,
    );
    // A little initial roll followed by a strong quadratic surge lets the
    // roadster visibly gather speed before it rockets ahead of Taco Hero.
    return OPENING_ROADSTER_X + 38 + (progress * .42 + progress * progress * .58) * 2500;
  }

  function updateOpeningScene(dt) {
    const opening = game.opening;
    if (opening.finished) return;
    const previousPhase = opening.phase;
    opening.timer += dt;
    opening.phase = openingPhaseAt(opening.timer);
    opening.carX = openingCarXAt(opening.timer);

    if (opening.phase !== previousPhase) {
      if (opening.phase === 'boarding') {
        playAudio('vehicle.approach', { vehicleType: 'roadster', position: audioPosition(opening.carX) });
        showMessage('TACOS LOADED. OLIVIA IS HOPPING IN!', 1.25);
      } else if (opening.phase === 'revving') {
        startRoadsterLoop(audioPosition(opening.carX));
        playAudio('vehicle.accelerate', { vehicleType: 'roadster', position: audioPosition(opening.carX) });
        showMessage('TACO ROADSTER: READY TO ROLL!', 1.15);
      } else if (opening.phase === 'departing') {
        stopRoadsterLoop();
        playAudio('vehicle.depart', { vehicleType: 'roadster', position: audioPosition(opening.carX) });
        showMessage('SHOWTIME! OLIVIA IS TAKING THE SCENIC ROUTE!', 2.05);
        spawnConfetti(opening.carX - game.cameraX + 80, GROUND_Y - 42, game.reducedShake ? 14 : 26);
      } else if (opening.phase === 'finished') {
        opening.finished = true;
        showMessage('SUNRISE SOUNDCHECK — GET THE SHOW ON THE ROAD!', 2.4);
      }
    }

    if (opening.phase === 'departing') {
      opening.dustTimer -= dt;
      if (opening.dustTimer <= 0) {
        opening.dustTimer = .075;
        const screenX = opening.carX - game.cameraX;
        if (screenX > -180 && screenX < canvas.width + 180) {
          spawnParticle(screenX + 18, GROUND_Y - 14, '#fff1bd', game.reducedShake ? 2 : 4);
          spawnParticle(screenX + 28, GROUND_Y - 11, '#50e7ff', 1);
        }
      }
    }
  }

  function setMusic(name, immediate = false) {
    if (game.muted || !tracks[name]) return;
    const next = tracks[name];
    if (game.activeMusic === name) {
      next.play().catch(() => {});
      return;
    }
    if (game.musicTransition) {
      allTracks.forEach((track) => {
        if (track !== game.musicTransition.to && !track.paused) { track.pause(); track.volume = 0; game.musicOverlapRecoveries += 1; }
      });
      game.musicTransition = null;
    }
    const fromName = game.activeMusic;
    const from = fromName ? tracks[fromName] : null;
    allTracks.forEach((track) => {
      if (track !== from && track !== next) { track.pause(); track.volume = 0; }
    });
    if (name !== 'concert') {
      if (from && Number.isFinite(from.duration) && Number.isFinite(next.duration) && from.duration > 0 && next.duration > 0) {
        next.currentTime = ((from.currentTime % from.duration) / from.duration) * next.duration;
      } else next.currentTime = 0;
    }
    const base = game.settingsOpen ? .42 : 1;
    next.volume = immediate || !from ? base : 0;
    next.play().catch(() => {});
    game.activeMusic = name;
    if (immediate || !from) {
      allTracks.forEach((track) => { if (track !== next) { track.pause(); track.volume = 0; } });
    } else {
      game.musicTransition = { fromName, toName: name, from, to: next, elapsed: 0, duration: name === 'concert' ? 3.8 : 3.1 };
      game.musicTransitionCount += 1;
    }
  }

  function updateMusic(dt) {
    const base = game.settingsOpen ? .42 : 1;
    game.maxMusicPlaying = Math.max(game.maxMusicPlaying, allTracks.filter((track) => !track.paused).length);
    if (!game.musicTransition) {
      if (game.activeMusic) tracks[game.activeMusic].volume = base;
      return;
    }
    const transition = game.musicTransition;
    transition.elapsed += dt;
    const progress = clamp(transition.elapsed / transition.duration, 0, 1);
    transition.from.volume = base * Math.cos(progress * Math.PI * .5);
    transition.to.volume = base * Math.sin(progress * Math.PI * .5);
    if (progress >= 1) {
      transition.from.pause();
      transition.from.volume = 0;
      allTracks.forEach((track) => { if (track !== transition.to) { track.pause(); track.volume = 0; } });
      transition.to.volume = base;
      game.musicTransition = null;
    }
  }

  function stopMusic() {
    allTracks.forEach((track) => { track.pause(); track.currentTime = 0; track.volume = 0; });
    game.activeMusic = null;
    game.musicTransition = null;
  }

  function startGame() {
    ui.startOverlay.classList.add('hidden');
    ui.startOverlay.classList.remove('visible');
    ui.winOverlay.classList.add('hidden');
    game.state = 'playing';
    game.startTime = performance.now();
    unlockAudio();
    playAudio('ui.start');
    if (previewConcert) {
      applyWorld23Phase2PreviewState();
      player.x = 34420;
      player.y = 350;
      game.cameraX = WORLD_WIDTH - canvas.width;
      startConcert(previewConcertTime);
      return;
    }
    if (previewStart > 0) {
      player.x = clamp(previewStart, 0, WORLD_WIDTH - player.w);
      player.y = Number.isFinite(previewStartY) ? previewStartY : 350;
      game.cameraX = clamp(player.x - canvas.width * .42, 0, WORLD_WIDTH - canvas.width);
    }
    if (Number.isFinite(previewEnergy)) game.energy = clamp(previewEnergy, 0, 100);
    if (Number.isFinite(previewGolden)) game.golden = Math.max(0, Math.floor(previewGolden));
    if (Number.isFinite(previewScore)) game.score = Math.max(0, Math.floor(previewScore));
    if (Number.isFinite(previewCollected)) game.collected = Math.max(0, Math.floor(previewCollected));
    if (Number.isFinite(previewBestSplat)) game.bestSplat = Math.max(0, Math.floor(previewBestSplat));
    if (Number.isFinite(previewGenerators)) {
      game.generators = clamp(Math.floor(previewGenerators), 0, world.generators.length);
      world.generators.forEach((generator, index) => {
        generator.activated = index < game.generators;
        generator.defenseState = generator.activated ? 'cleared' : 'armed';
      });
      const activeGeneratorIds = new Set(world.generators
        .filter((generator) => generator.activated)
        .map((generator) => generator.id));
      world.enemies.forEach((enemy) => {
        if (enemy.generatorId && activeGeneratorIds.has(enemy.generatorId)) enemy.alive = false;
      });
    }
    if (previewOpeningTime > 0) {
      game.opening.timer = Math.min(previewOpeningTime, openingTimeline.departingEnd);
      game.opening.phase = openingPhaseAt(game.opening.timer);
      game.opening.carX = openingCarXAt(game.opening.timer);
      game.opening.finished = game.opening.phase === 'finished';
    }
    game.pinata.hits = previewPinataHits;
    applyWorld23Phase2PreviewState();
    if (previewCableCrawler) {
      player.x = Math.max(player.x, CABLE_CRAWLER_ARENA.left + 38);
      player.y = Math.min(player.y, CABLE_CRAWLER_ARENA.platformY - player.h);
      game.cameraX = clamp(CABLE_CRAWLER_X - canvas.width * .5, 0, WORLD_WIDTH - canvas.width);
      startCableCrawler();
      if (Number.isFinite(previewCableCrawlerHealth)) game.cableCrawler.health = previewCableCrawlerHealth;
      if (previewCableCrawlerPhase) {
        enterCableCrawlerPhase(
          previewCableCrawlerPhase,
          previewCableCrawlerPhase === 'vulnerable' ? 8 : 2.4,
        );
      }
      if (previewCableCrawlerDefeated) defeatCableCrawler();
    }
    if (previewBoss) {
      player.x = Math.max(player.x, FEEDBACK_FIEND_ARENA.left + 150);
      game.cameraX = clamp(
        (FEEDBACK_FIEND_ARENA.left + FEEDBACK_FIEND_ARENA.right) / 2 - canvas.width / 2,
        0, WORLD_WIDTH - canvas.width,
      );
      startFeedbackFiend();
      if (Number.isFinite(previewBossHealth)) game.boss.health = previewBossHealth;
      if (previewBossPhase) enterFeedbackFiendPhase(previewBossPhase, previewBossPhase === 'vulnerable' ? 8 : 2.4);
      if (previewBossDefeated) defeatFeedbackFiend();
    }
    if (previewRespawn) {
      if (previewRespawnCheckpoint >= 0 && world.checkpoints[previewRespawnCheckpoint]) {
        game.latestCheckpoint = world.checkpoints[previewRespawnCheckpoint];
      }
      player.y = canvas.height + 120;
      beginRespawn();
    }
    if (previewAutoRun) {
      inputSources.keyboard.right = true;
      syncInputs();
    }
    setMusic(currentSection().music, true);
    showMessage('OLIVIA IS LOADING THE LAST TACOS!', 2.1);
  }

  function setupInputs() {
    const inputForCode = (code) => ['ArrowLeft', 'KeyA'].includes(code) ? 'left'
      : ['ArrowRight', 'KeyD'].includes(code) ? 'right'
        : ['Space', 'ArrowUp', 'KeyW'].includes(code) ? 'jump' : null;
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && game.settingsOpen) closeSettings();
      if (game.settingsOpen) return;
      const input = inputForCode(event.code);
      if (input) {
        event.preventDefault();
        if (!event.isTrusted && window.JFT_CONTROLLER) return;
        if (input !== 'jump' || !event.repeat) setDigitalInput('keyboard', input, true);
      }
      if (event.code === 'Enter' && game.state === 'title') startGame();
    });
    window.addEventListener('keyup', (event) => {
      const input = inputForCode(event.code);
      if (!input || (!event.isTrusted && window.JFT_CONTROLLER)) return;
      setDigitalInput('keyboard', input, false);
    });
    document.querySelectorAll('.touch-btn').forEach((button) => {
      const action = button.dataset.input;
      const press = (event) => {
        event.preventDefault();
        unlockAudio();
        if (game.state === 'title') startGame();
        try { button.setPointerCapture(event.pointerId); } catch { /* optional */ }
        setDigitalInput('touch', action, true, event.pointerId);
      };
      const release = (event) => {
        event.preventDefault();
        setDigitalInput('touch', action, false, event.pointerId);
      };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
    const releasePointer = (event) => {
      ['left', 'right', 'jump'].forEach((input) => setDigitalInput('touch', input, false, event.pointerId));
    };
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearInputs();
      lastFrame = 0;
    });
    window.addEventListener('jft:controlleraction', (event) => {
      if (game.settingsOpen) return;
      const { action, pressed } = event.detail || {};
      if (!['left', 'right', 'jump'].includes(action)) return;
      setDigitalInput('controller', action, Boolean(pressed));
    });
    window.addEventListener('jft:controllerstate', (event) => {
      if (game.settingsOpen) return;
      const detail = event.detail || {};
      if (detail.connected === false) return;
      ['left', 'right'].forEach((input) => {
        const pressed = Boolean(detail[input]);
        if (inputSources.controller[input] !== pressed) setDigitalInput('controller', input, pressed);
      });
    });
    window.addEventListener('jft:gamepaddisconnected', () => {
      ['left', 'right', 'jump'].forEach((input) => { inputSources.controller[input] = false; });
      syncInputs();
    });
    ui.startBtn.addEventListener('click', startGame);
    ui.restartBtn.addEventListener('click', () => { resetGame(); playAudio('ui.confirm'); startGame(); });
    ui.playAgainBtn.addEventListener('click', () => { resetGame(); playAudio('ui.confirm'); startGame(); });
    ui.skipConcertBtn.addEventListener('click', skipConcert);
    ui.muteBtn.addEventListener('click', () => {
      game.muted = !game.muted;
      syncSettings();
      if (game.muted) stopMusic();
      else { unlockAudio(); setMusic(game.state === 'concert' ? 'concert' : currentSection().music, true); }
      saveProgress();
    });
    ui.settingsBtn.addEventListener('click', openSettings);
    ui.closeSettingsBtn.addEventListener('click', closeSettings);
    ui.musicVolume.addEventListener('input', () => {
      game.musicVolume = Number(ui.musicVolume.value) / 100;
      ui.musicVolumeValue.textContent = `${ui.musicVolume.value}%`;
      audio?.setMusicVolume(game.musicVolume);
      updateMusic(0);
      saveProgress();
    });
    ui.effectsVolume.addEventListener('input', () => {
      game.effectsVolume = Number(ui.effectsVolume.value) / 100;
      ui.effectsVolumeValue.textContent = `${ui.effectsVolume.value}%`;
      audio?.setEffectsVolume(game.effectsVolume);
      saveProgress();
    });
    ui.reducedShake.addEventListener('change', () => {
      game.reducedShake = ui.reducedShake.checked;
      saveProgress();
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

  function updateMovingPlatforms() {
    const time = game.levelTime;
    for (const platform of world.platforms) {
      platform.dx = 0;
      platform.dy = 0;
      if (!platform.moving) continue;
      const oldX = platform.x;
      const oldY = platform.y;
      const phase = time * platform.speed + platform.phase;
      if (platform.axis === 'x') platform.x = platform.baseX + Math.sin(phase) * platform.range;
      else platform.y = platform.baseY + Math.sin(phase) * platform.range;
      platform.dx = platform.x - oldX;
      platform.dy = platform.y - oldY;
    }
  }

  function updatePlayer(dt, concertMode = false) {
    if (abilities.suspendForTransformation(game.abilities, player, { disabled: concertMode })) return;
    const wasGrounded = player.grounded;
    if (player.grounded) abilities.land(game.abilities);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.grounded ? heroPhysics.coyoteTime : Math.max(0, player.coyote - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    const direction = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const maxSpeed = concertMode ? 285 : 310;
    player.vx = lerp(player.vx, direction * maxSpeed, Math.min(1, dt * (player.grounded ? 14 : 8)));
    player.anim += dt * Math.max(2, Math.abs(player.vx) / 34);
    if (!direction && player.grounded) player.vx *= Math.pow(.001, dt);
    if (direction) player.dir = direction;
    if (player.jumpBuffer > 0 && player.coyote > 0) {
      player.vy = -heroPhysics.jumpVelocity;
      player.grounded = false;
      player.platform = null;
      player.coyote = 0;
      player.jumpBuffer = 0;
      playAudio('hero.jump', { position: audioPosition(player.x + player.w / 2) });
    } else if (player.jumpBuffer > 0 && !player.grounded) {
      const superJumpVelocity = abilities.trySuperJump(game.abilities, { suspended: concertMode, position: audioPosition(player.x + player.w / 2) });
      if (superJumpVelocity) { player.vy = -superJumpVelocity; player.platform = null; player.jumpBuffer = 0; game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 2 : 5); }
      else if (concertMode) player.jumpBuffer = 0;
    }

    const previousY = player.y;
    player.previousY = previousY;
    player.previousBottom = previousY + player.h;
    if (player.platform?.moving && player.grounded) {
      player.x += player.platform.dx;
      player.y += player.platform.dy;
    }
    player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt);
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    const landingVelocity = player.vy;
    player.grounded = false;
    player.platform = null;

    const platforms = concertMode ? game.concert.platforms : world.platforms;
    for (const platform of platforms) {
      if (player.x + player.w < platform.x || player.x > platform.x + platform.w) continue;
      const oldBottom = previousY + player.h;
      const newBottom = player.y + player.h;
      if (player.vy >= 0 && oldBottom <= platform.y + 14 && newBottom >= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
        player.platform = platform;
        abilities.land(game.abilities);
      }
    }
    if (!wasGrounded && player.grounded && landingVelocity > 90) {
      playAudio(landingVelocity >= 830 ? 'hero.landHard' : 'hero.landSoft', {
        position: audioPosition(player.x + player.w / 2),
      });
    }
    const maxX = concertMode ? 920 - player.w : WORLD_WIDTH - player.w;
    player.x = clamp(player.x, concertMode ? 20 : 0, maxX);
    if (player.y > 590) {
      playAudio('hero.fall', { position: audioPosition(player.x + player.w / 2) });
      if (concertMode) {
        abilities.clearForRespawn(game.abilities);
        player.x = 120;
        player.y = 360;
        player.vy = 0;
      } else {
        beginRespawn();
      }
    }
  }

  function findRespawnPoint(sourceX) {
    const desiredX = game.latestCheckpoint?.x + 28 || Math.max(130, sourceX - 360);
    const groundPlatforms = world.platforms.filter((platform) => platform.ground);
    let support = groundPlatforms.find((platform) => desiredX >= platform.x + 36
      && desiredX <= platform.x + platform.w - player.w - 36);
    if (!support) {
      support = groundPlatforms.reduce((best, platform) => {
        const center = platform.x + platform.w / 2;
        return !best || Math.abs(center - desiredX) < Math.abs(best.x + best.w / 2 - desiredX) ? platform : best;
      }, null);
    }
    const targetX = support
      ? clamp(desiredX, support.x + 42, support.x + support.w - player.w - 42)
      : clamp(desiredX, 0, WORLD_WIDTH - player.w);
    const targetY = support ? support.y - player.h : GROUND_Y - player.h;
    return { targetX, targetY, airY: Math.max(36, targetY - 230) };
  }

  function beginRespawn() {
    if (game.state === 'respawning' || game.respawn.active) return;
    if (!game.cableCrawler.defeated && game.cableCrawler.phase !== 'dormant') resetCableCrawlerForRetry();
    if (!game.boss.defeated && game.boss.phase !== 'dormant') resetFeedbackFiendForRetry();
    game.state = 'respawning';
    clearInputs();
    abilities.clearForRespawn(game.abilities);
    game.hearts -= 1;
    if (game.hearts <= 0) game.hearts = 3;
    const sourceX = player.x;
    const sourceY = Math.min(player.y, canvas.height - player.h - 8);
    const point = findRespawnPoint(sourceX);
    heroCore.beginRespawn(game.respawn, {
      fromX: sourceX, fromY: sourceY, ...point,
    });
    game.respawnCount += 1;
    player.x = sourceX;
    player.y = sourceY;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.platform = null;
    player.coyote = 0;
    player.jumpBuffer = 0;
    playAudio('hero.respawnBeam', { position: audioPosition(player.x + player.w / 2) });
    showMessage('TACO HERO IS RETURNING WITH EXTRA CRUNCH!', 1.8);
  }

  function updateRespawn(dt) {
    const result = heroCore.advanceRespawn(game.respawn, player, dt);
    if (result.shouldPlace) {
      heroCore.placeRespawn(game.respawn, player);
      spawnConfetti(player.x - game.cameraX + player.w / 2, 92, 18);
    }
    game.cameraX = lerp(game.cameraX, clamp(game.respawn.targetX - canvas.width * .42, 0, WORLD_WIDTH - canvas.width), Math.min(1, dt * 6));
    if (!game.respawn.spawnPlaced) return;

    const previousY = player.y;
    player.vy = Math.min(heroPhysics.maxFallVelocity, player.vy + heroPhysics.gravity * dt);
    player.y += player.vy * dt;
    player.grounded = false;
    player.platform = null;
    const previousBottom = previousY + player.h;
    const currentBottom = player.y + player.h;
    for (const platform of world.platforms) {
      if (player.x + player.w <= platform.x + 5 || player.x >= platform.x + platform.w - 5) continue;
      if (player.vy >= 0 && previousBottom <= platform.y + 10 && currentBottom >= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
        player.platform = platform;
        break;
      }
    }
    if (!player.grounded && game.respawn.timer > 3) {
      player.x = game.respawn.targetX;
      player.y = game.respawn.targetY;
      player.vx = 0;
      player.vy = 0;
      player.grounded = true;
      player.platform = world.platforms.find((platform) => player.x + player.w > platform.x + 5 && player.x < platform.x + platform.w - 5 && Math.abs(platform.y - (player.y + player.h)) <= 12) || null;
      game.respawnFallbacks += 1;
    }
    if (player.grounded && game.respawn.timer > .8) {
      game.lastRespawnLanding = { x: Math.round(player.x), y: Math.round(player.y), grounded: true, fallback: game.respawn.timer > 3 };
      playAudio('hero.respawnLand', { position: audioPosition(player.x + player.w / 2) });
      heroCore.finishRespawn(game.respawn, player, 1.6);
      game.state = 'playing';
      clearInputs();
      if (previewAutoRun) {
        inputSources.keyboard.right = true;
        syncInputs();
      }
    }
  }

  function updateEnemies(dt) {
    let stompResolvedThisFrame = false;
    for (let index = 0; index < world.enemies.length; index += 1) {
      const enemy = world.enemies[index];
      if (!enemy.alive) {
        enemy.splat += dt;
        continue;
      }
      const previousEnemyTop = enemy.y;
      const speedScale = heroCore.updateEnemyBehavior(enemy, dt, {
        index, fallback: enemy.behaviorType,
        onTear: (source) => spawnParticle(source.x - game.cameraX + 24, source.y + 12, '#8ff6ff', 4),
      });
      enemy.x += enemy.dir * enemy.speed * speedScale * dt;
      if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) enemy.dir *= -1;
      const contact = heroCore.classifyEnemyContact(player, enemy, {
        previousBottom: player.previousBottom,
        previousTargetTop: previousEnemyTop,
      });
      if (!contact || stompResolvedThisFrame) continue;
      const stomp = contact === 'stomp';
      if (stomp || abilities.isFrenzy(game.abilities)) {
        if (stomp) stompResolvedThisFrame = true;
        defeatEnemy(enemy, stomp);
      } else hurtPlayer(enemy.x);
    }
  }

  function announceSuper() {
    showMessage('SUPER TACO HERO!', 2.1);
    const screenX = game.state === 'concert' ? player.x + player.w / 2 : player.x - game.cameraX + player.w / 2;
    spawnConfetti(screenX, player.y + player.h / 2, game.reducedShake ? 44 : 100);
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 10);
  }

  function hurtPlayer(fromX) {
    if (player.invulnerable > 0 || abilities.isFrenzy(game.abilities) || game.state !== 'playing') return;
    const knockbackX = player.x < fromX ? -260 : 260;
    if (abilities.absorbDamage(game.abilities, { position: audioPosition(player.x + player.w / 2) })) {
      player.invulnerable = abilities.definitions.superHero.damageInvulnerabilityDuration;
      player.vx = knockbackX; player.vy = -320;
      game.cameraShake = game.reducedShake ? 4 : 9;
      showMessage('SUPER POWER DOWN! NORMAL TACO HERO!', 1.45);
      spawnBurst(player.x - game.cameraX + player.w / 2, player.y + player.h / 2, '#ff4fac', 38);
      return;
    }
    player.invulnerable = 1.2; player.vx = knockbackX; player.vy = -320; game.hearts -= 1;
    game.cameraShake = game.reducedShake ? 3 : 9;
    playAudio('hero.hurt', { position: audioPosition(player.x + player.w / 2) });
    if (game.hearts <= 0) beginRespawn();
  }

  function defeatEnemy(enemy, stomped) {
    enemy.alive = false;
    enemy.splat = 0;
    if (stomped) {
      player.y = Math.min(player.y, enemy.y - player.h - 1);
      player.vy = -heroPhysics.enemyBounceVelocity;
      player.grounded = false;
      player.platform = null;
    }
    game.splatCombo += 1;
    game.splatTimer = 1.45;
    game.bestSplat = Math.max(game.bestSplat, game.splatCombo);
    game.score += 650 * game.splatCombo;
    game.energy = clamp(game.energy + (game.splatCombo >= 5 ? 5 : 2), 0, 100);
    const superStarted = abilities.splatEnemy(game.abilities, { position: audioPosition(enemy.x + enemy.w / 2) });
    const feedback = heroCore.splatFeedback(game.splatCombo, stomped);
    game.impactTexts.push({ x: enemy.x - game.cameraX + 24, y: enemy.y - 16, text: feedback.text, color: feedback.color, life: 1.1 });
    spawnBurst(enemy.x - game.cameraX + 24, enemy.y + 20, feedback.color, 14);
    playAudio(stomped ? 'combat.enemyStomp' : 'combat.enemySplat', {
      enemyType: enemy.type,
      combo: Math.max(1, game.splatCombo),
      position: audioPosition(enemy.x + enemy.w / 2),
    });
    const celebration = heroCore.celebrateSplatCombo(game.splatCombo, {
      reduced: game.reducedShake,
      onCelebrate: (reward) => {
        spawnConfetti(enemy.x - game.cameraX + 24, enemy.y, reward.confetti);
        game.cameraShake = reward.shake;
        game.hitStop = reward.hitStop;
        showMessage(reward.label, reward.duration);
        playAudio('combat.comboMilestone', {
          combo: game.splatCombo,
          gain: reward.tier === 'supremacy' ? 1.08 : 1,
        });
        if (reward.tier === 'supremacy') {
          for (let i = 0; i < 15; i += 1) addTaco(enemy.x + (i - 7) * 24, enemy.y - 60 - Math.sin(i / 14 * Math.PI) * 100, 'taco', { bonus: true });
        }
      },
    });
    if (superStarted) announceSuper();
    else if (!celebration && game.splatCombo > 1) showMessage(`${feedback.text} — CONCERT ENERGY UP!`, 1.1);
  }

  function collectTaco(item) {
    item.collected = true;
    let collectionEventId = 'collect.taco';
    let premiumType;
    if (item.type === 'golden') {
      game.golden += 1;
      game.score += 2500;
      game.energy = clamp(game.energy + 4, 0, 100);
      showMessage('GOLDEN BACKSTAGE PASS!', 1.25);
      collectionEventId = 'collect.backstagePass';
      premiumType = 'backstagePass';
      spawnConfetti(item.x - game.cameraX, item.y, 28);
      abilities.activateMagnet(game.abilities);
      playAudio('ability.magnetStart', { position: audioPosition(item.x + item.w / 2) });
    } else if (item.type === 'rainbow') {
      game.collected += 1;
      game.score += 1000;
      game.energy = clamp(game.energy + 1.5, 0, 100);
      collectionEventId = 'collect.rainbowTaco';
      premiumType = 'concertRainbow';
      spawnConfetti(item.x - game.cameraX, item.y, game.reducedShake ? 12 : 24);
    } else {
      game.collected += 1;
      if (item.airborneDrop) game.boat.catches += 1;
      game.score += 100;
      game.energy = clamp(game.energy + .08, 0, 100);
    }
    const superStarted = abilities.collectTaco(game.abilities, item.type, { position: audioPosition(item.x + item.w / 2) });
    if (superStarted) {
      announceSuper();
      if (item.type === 'golden') showMessage('GOLDEN BACKSTAGE PASS — SUPER TACO HERO!', 2.1);
    }
    playAudio(collectionEventId, {
      streak: game.collected + game.golden,
      position: audioPosition(item.x + item.w / 2),
      premiumType,
    });
  }

  function updateCollectibles(dt) {
    for (const item of world.tacos) {
      if (item.collected) continue;
      if (item.airborneDrop && !item.settled) {
        item.vy = Math.min(650, item.vy + 520 * dt);
        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.rotation = (item.rotation || 0) + item.spin * dt;
        if (item.y >= GROUND_Y - item.h - 5) {
          item.y = GROUND_Y - item.h - 5;
          item.vy *= -.42;
          item.vx *= .72;
          item.bounces = (item.bounces || 0) + 1;
          if (item.bounces >= 2 || Math.abs(item.vy) < 70) item.settled = true;
        }
      }
      if (abilities.hasMagnet(game.abilities)) {
        const dx = player.x + player.w / 2 - (item.x + item.w / 2);
        const dy = player.y + player.h / 2 - (item.y + item.h / 2);
        const distance = Math.hypot(dx, dy);
        if (distance < 290) { item.x += dx * dt * 8; item.y += dy * dt * 8; }
      }
      if (intersects(player, item)) collectTaco(item);
    }
  }

  function updateCheckpoints() {
    for (const checkpoint of world.checkpoints) {
      if (checkpoint.activated || Math.abs(player.x - checkpoint.x) > 100) continue;
      checkpoint.activated = true;
      game.latestCheckpoint = checkpoint;
      game.score += 1200;
      game.energy = clamp(game.energy + 3, 0, 100);
      showMessage(`${checkpoint.name.toUpperCase()} — ${checkpoint.sign}`, 3.1);
      spawnConfetti(checkpoint.x - game.cameraX + 70, 270, 44);
      playAudio('checkpoint.activate', { position: audioPosition(checkpoint.x) });
    }
  }

  function activateGenerator(generator) {
    if (generator.activated) return;
    generator.defenseState = 'cleared';
    generator.activated = true;
    game.generators += 1;
    game.energy = clamp(game.energy + 10, 0, 100);
    game.score += 4000;
    showMessage(`${generator.name} ONLINE — ${game.generators}/3 STAGE CIRCUITS POWERED!`, 2.2);
    spawnConfetti(generator.x - game.cameraX, 230, game.reducedShake ? 45 : 90);
    game.cameraShake = game.reducedShake ? 4 : 12;
    playAudio('stage.generatorActivate', {
      index: game.generators,
      generatorType: generator.id,
      position: audioPosition(generator.x),
    });
  }

  function updateGenerators() {
    for (const generator of world.generators) {
      if (generator.activated) continue;
      const remaining = world.enemies.filter((enemy) => enemy.generatorId === generator.id && enemy.alive).length;
      generator.defeatedCount = (generator.defenseTotal || 0) - remaining;

      // Clearing a defense now powers its tower immediately. The former
      // proximity check could leave a cleared tower inert when the final
      // defender was defeated near the outside edge of its patrol pad.
      if (remaining === 0) {
        activateGenerator(generator);
        continue;
      }

      generator.defenseState = 'armed';
      if (Math.abs(player.x - generator.x) > 90) continue;
      if (generator.lastWarning !== Math.floor(game.levelTime * 2)) {
        generator.lastWarning = Math.floor(game.levelTime * 2);
        showMessage(`${generator.name}: CLEAR ${remaining} DEFENDER${remaining === 1 ? '' : 'S'} BEFORE POWER-UP!`, 1.35);
      }
    }
  }

  function world23Phase2Station(id) {
    return world.phase2Stations.find((station) => station.id === id) || null;
  }

  function spawnWorld23Phase2Reward(station) {
    if (!station || station.rewardSpawned) return;
    station.rewardSpawned = true;
    const columns = Math.min(station.reward.columns || 9, station.reward.count);
    for (let index = 0; index < station.reward.count; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const type = index % station.reward.rainbowEvery === station.reward.rainbowEvery - 1
        ? 'rainbow' : 'taco';
      addTaco(
        station.reward.x + column * 34,
        station.reward.y - row * 34 - Math.sin(column / Math.max(1, columns - 1) * Math.PI) * 18,
        type,
        { phase2Reward: station.id, bonus: true },
      );
    }
  }

  function completeWorld23Phase2Station(station, { silent = false } = {}) {
    if (!station || station.completed) return false;
    station.completed = true;
    station.activatedAt = game.levelTime;
    station.progress = 1;
    if (station.dialogue && !station.dialoguePlayed) {
      station.dialoguePlayed = true;
      station.dialogueTimer = 3.2;
    }
    if (!game.phase2.completedIds.includes(station.id)) game.phase2.completedIds.push(station.id);
    game.score += station.score;
    game.energy = clamp(game.energy + station.energy, 0, 100);

    if (station.secret) {
      game.phase2.secretBanner = {
        title: 'ENCORE STASH', subtitle: 'DISCOVERED!', timer: 3.35,
      };
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 5 : 13);
    } else {
      game.phase2.toast = {
        title: station.completion,
        subtitle: station.id === 'marquee' ? 'VENUE ENTRANCE POWERED'
          : station.id === 'rooftops' ? 'RHYTHM SECTION LOCKED IN'
            : station.id === 'lagoon' ? 'WATERFRONT REHEARSAL READY'
              : 'ADMISSION LIGHTS BLAZING',
        color: station.accent,
        timer: 2.75,
      };
    }

    if (!silent) {
      spawnWorld23Phase2Reward(station);
      const screenX = station.trigger.x + station.trigger.w / 2 - game.cameraX;
      spawnConfetti(screenX, station.trigger.y + 80, station.secret
        ? (game.reducedShake ? 95 : 210) : (game.reducedShake ? 28 : 58));
      spawnBurst(screenX, station.trigger.y + 74, station.accent, station.secret
        ? (game.reducedShake ? 24 : 56) : (game.reducedShake ? 10 : 22));
      const eventId = {
        marquee: 'concert.start',
        rooftops: 'concert.start',
        lagoon: 'concert.tambourineAccent',
        golden: 'checkpoint.activate',
        encore: 'concert.start',
      }[station.id];
      playAudio(eventId, { position: audioPosition(station.trigger.x), station: station.id });
      if (station.secret) {
        showMessage('ENCORE STASH DISCOVERED!', 3.2);
        spawnFireworks(game.reducedShake ? 5 : 10);
      }
    }
    return true;
  }

  function applyWorld23Phase2PreviewState() {
    if (!previewPhase2Complete) return;
    const requested = previewPhase2Complete === 'all'
      ? new Set(world.phase2Stations.map((station) => station.id))
      : new Set(previewPhase2Complete.split(',').map((id) => id.trim()).filter(Boolean));
    world.phase2Stations.forEach((station) => {
      if (requested.has(station.id)) completeWorld23Phase2Station(station, { silent: true });
      if (requested.has(station.id)) station.dialogueTimer = 0;
    });
    game.phase2.toast = null;
    game.phase2.secretBanner = null;
  }

  function updateWorld23BassStack() {
    const station = world23Phase2Station('rooftops');
    if (!station) return;
    const beatPosition = game.levelTime / BASS_STACK_BEAT_SECONDS;
    const beatCycle = Math.floor(beatPosition);
    const beatPhase = beatPosition - beatCycle;
    station.beatCycle = beatCycle;
    station.beatPhase = beatPhase;
    if (!player.grounded || !player.platform?.bassPad || beatPhase > .31) return;
    const pad = player.platform;
    if (pad.lastLaunchCycle === beatCycle) return;
    pad.lastLaunchCycle = beatCycle;
    player.vy = -BASS_STACK_LAUNCH_VELOCITY;
    player.grounded = false;
    player.platform = null;
    const screenX = pad.x + pad.w / 2 - game.cameraX;
    spawnBurst(screenX, pad.y + 8, '#a4f766', game.reducedShake ? 10 : 22);
    game.impactTexts.push({ x: screenX, y: pad.y - 25, text: 'WHUMM!', color: '#a4f766', life: .85 });
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 2 : 5);
    playAudio('concert.tambourineAccent', { position: audioPosition(pad.x + pad.w / 2), bassLaunch: true });
  }

  function updateWorld23Phase2(dt) {
    if (game.phase2.toast) {
      game.phase2.toast.timer = Math.max(0, game.phase2.toast.timer - dt);
      if (game.phase2.toast.timer <= 0) game.phase2.toast = null;
    }
    if (game.phase2.secretBanner) {
      game.phase2.secretBanner.timer = Math.max(0, game.phase2.secretBanner.timer - dt);
      if (game.phase2.secretBanner.timer <= 0) game.phase2.secretBanner = null;
    }
    world.phase2Stations.forEach((station) => {
      station.dialogueTimer = Math.max(0, station.dialogueTimer - dt);
      if (!station.completed) {
        station.progress = Math.max(
          station.progress,
          clamp((player.x - station.start) / Math.max(1, station.end - station.start), 0, 1),
        );
        if (station.dialogue && !station.dialoguePlayed
          && Math.abs(player.x + player.w / 2 - station.dialogueX) < 300) {
          station.dialoguePlayed = true;
          station.dialogueTimer = 3.2;
        }
        if (intersects(player, station.trigger)) completeWorld23Phase2Station(station);
      }
    });
    const groundCameo = world.bandCameos[0];
    if (groundCameo) {
      groundCameo.dialogueTimer = Math.max(0, (groundCameo.dialogueTimer || 0) - dt);
      if (!game.phase2.groundCameoSeen && Math.abs(player.x - groundCameo.x) < 210) {
        game.phase2.groundCameoSeen = true;
        groundCameo.dialogueTimer = 3.1;
      }
    }
    updateWorld23BassStack();
  }

  function cableCrawlerBody() {
    return {
      x: CABLE_CRAWLER_X - 67,
      y: CABLE_CRAWLER_ARENA.platformY - 94,
      w: 134,
      h: 94,
    };
  }

  function cableCrawlerCore() {
    return {
      x: CABLE_CRAWLER_X - 43,
      y: CABLE_CRAWLER_ARENA.platformY - 105,
      w: 86,
      h: 48,
    };
  }

  function enterCableCrawlerPhase(phase, duration) {
    const crawler = game.cableCrawler;
    crawler.phase = phase;
    crawler.phaseTimer = duration;
    crawler.lastAttack = phase;
    if (phase === 'sweepCharge') {
      crawler.attackCycle += 1;
      crawler.sweep = null;
      crawler.plugTargets.length = 0;
      playAudio('boss.cableCrawler.sweepWarn', { position: audioPosition(CABLE_CRAWLER_X) });
    } else if (phase === 'cableSweep') {
      crawler.sweep = { timer: duration, duration, resolved: false };
      playAudio('boss.cableCrawler.cableSweep', { position: audioPosition(CABLE_CRAWLER_X) });
    } else if (phase === 'plugTelegraph') {
      const playerCenter = clamp(
        player.x + player.w / 2,
        CABLE_CRAWLER_ARENA.left + 52,
        CABLE_CRAWLER_ARENA.right - 52,
      );
      const opposite = playerCenter < CABLE_CRAWLER_X
        ? CABLE_CRAWLER_ARENA.right - 70
        : CABLE_CRAWLER_ARENA.left + 70;
      crawler.plugTargets = [playerCenter, opposite].map((x) => ({
        x, telegraph: duration, impact: 0, resolved: false,
      }));
      playAudio('boss.cableCrawler.plugWarn', { position: audioPosition(playerCenter) });
    } else if (phase === 'plugImpact') {
      crawler.plugTargets.forEach((target) => {
        target.telegraph = 0;
        target.impact = duration;
        target.resolved = false;
        spawnBurst(target.x - game.cameraX, CABLE_CRAWLER_ARENA.platformY - 5, '#ffd65a', game.reducedShake ? 5 : 11);
      });
      playAudio('boss.cableCrawler.plugImpact', { position: audioPosition(CABLE_CRAWLER_X) });
    } else if (phase === 'vulnerable') {
      crawler.invulnerable = 0;
      crawler.sweep = null;
      crawler.plugTargets.length = 0;
      playAudio('boss.cableCrawler.vulnerable', { position: audioPosition(CABLE_CRAWLER_X) });
      showMessage('CABLES TANGLED — STOMP THE GLOWING CORE!', 1.65);
    }
  }

  function startCableCrawler() {
    const crawler = game.cableCrawler;
    if (crawler.defeated || crawler.phase !== 'dormant') return;
    crawler.triggered = true;
    crawler.sweep = null;
    crawler.plugTargets.length = 0;
    enterCableCrawlerPhase('intro', 1.05);
    if (!crawler.announced) {
      crawler.announced = true;
      showMessage('CABLE CRAWLER — UNTANGLE THE ROADIE SYSTEMS!', 2.05);
      playAudio('boss.cableCrawler.enter', { position: audioPosition(CABLE_CRAWLER_X) });
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 2 : 5);
    }
  }

  function resetCableCrawlerForRetry() {
    const previous = game.cableCrawler;
    const retryCount = (previous.retryCount || 0) + 1;
    const triggered = previous.triggered;
    const announced = previous.announced;
    game.cableCrawler = createCableCrawlerState();
    game.cableCrawler.retryCount = retryCount;
    game.cableCrawler.triggered = triggered;
    game.cableCrawler.announced = announced;
  }

  function spawnCableCrawlerReward() {
    const crawler = game.cableCrawler;
    if (crawler.rewardSpawned) return;
    crawler.rewardSpawned = true;
    for (let index = 0; index < 8; index += 1) {
      addTaco(
        CABLE_CRAWLER_ARENA.left + 42 + index * 43,
        CABLE_CRAWLER_ARENA.platformY - 64 - Math.sin(index / 7 * Math.PI) * 46,
        index === 3 ? 'rainbow' : 'taco',
        { cableCrawlerReward: true, bonus: true },
      );
    }
  }

  function defeatCableCrawler() {
    const crawler = game.cableCrawler;
    if (crawler.defeated) return;
    crawler.defeated = true;
    crawler.defeatedAt = game.levelTime;
    crawler.health = 0;
    crawler.phase = 'defeated';
    crawler.phaseTimer = 1.45;
    crawler.sweep = null;
    crawler.plugTargets.length = 0;
    crawler.utilityPowered = true;
    game.score += 5200;
    game.energy = clamp(game.energy + 7, 0, 100);
    spawnCableCrawlerReward();
    spawnConfetti(CABLE_CRAWLER_X - game.cameraX, CABLE_CRAWLER_ARENA.platformY - 75, game.reducedShake ? 38 : 86);
    spawnBurst(CABLE_CRAWLER_X - game.cameraX, CABLE_CRAWLER_ARENA.platformY - 70, '#50e7ff', game.reducedShake ? 12 : 28);
    spawnBurst(CABLE_CRAWLER_X - game.cameraX, CABLE_CRAWLER_ARENA.platformY - 62, '#a4f766', game.reducedShake ? 9 : 20);
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 9);
    game.hitStop = Math.max(game.hitStop, .1);
    showMessage('ROADIE SYSTEMS ONLINE', 2.05);
    playAudio('boss.cableCrawler.defeat', { position: audioPosition(CABLE_CRAWLER_X) });
  }

  function damageCableCrawler() {
    const crawler = game.cableCrawler;
    if (crawler.phase !== 'vulnerable' || crawler.invulnerable > 0 || crawler.defeated) return;
    crawler.health -= 1;
    crawler.hitsTaken += 1;
    crawler.invulnerable = .72;
    const core = cableCrawlerCore();
    player.y = Math.min(player.y, core.y - player.h - 1);
    player.vy = -heroPhysics.enemyBounceVelocity;
    player.grounded = false;
    player.platform = null;
    game.score += 1450;
    game.energy = clamp(game.energy + 2, 0, 100);
    spawnBurst(CABLE_CRAWLER_X - game.cameraX, core.y + 18, '#fff170', game.reducedShake ? 11 : 24);
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 3 : 7);
    game.hitStop = Math.max(game.hitStop, .065);
    playAudio('boss.cableCrawler.damage', { position: audioPosition(CABLE_CRAWLER_X), hit: crawler.hitsTaken });
    if (crawler.health <= 0) {
      defeatCableCrawler();
      return;
    }
    showMessage(`CABLE CRAWLER UNPLUGGED — ${crawler.health} HIT${crawler.health === 1 ? '' : 'S'} LEFT!`, 1.35);
    enterCableCrawlerPhase('hurt', .72);
  }

  function updateCableCrawlerHazards(dt) {
    const crawler = game.cableCrawler;
    if (crawler.sweep) {
      crawler.sweep.timer = Math.max(0, crawler.sweep.timer - dt);
      const progress = 1 - crawler.sweep.timer / crawler.sweep.duration;
      const sweepX = lerp(
        CABLE_CRAWLER_ARENA.left + 26,
        CABLE_CRAWLER_ARENA.right - 26,
        smoothStep(progress),
      );
      const hazard = {
        x: sweepX - 33,
        y: CABLE_CRAWLER_ARENA.platformY - 47,
        w: 66,
        h: 35,
      };
      if (!crawler.sweep.resolved && intersects(player, hazard)) {
        crawler.sweep.resolved = true;
        hurtPlayer(sweepX);
      }
      if (crawler.sweep.timer <= 0) crawler.sweep = null;
    }

    for (const target of crawler.plugTargets) {
      target.telegraph = Math.max(0, target.telegraph - dt);
      target.impact = Math.max(0, target.impact - dt);
      if (target.impact <= 0 || target.resolved) continue;
      const hazard = {
        x: target.x - 34,
        y: CABLE_CRAWLER_ARENA.platformY - 128,
        w: 68,
        h: 128,
      };
      if (intersects(player, hazard)) {
        target.resolved = true;
        hurtPlayer(target.x);
      }
    }
  }

  function updateCableCrawler(dt) {
    const crawler = game.cableCrawler;
    crawler.invulnerable = Math.max(0, crawler.invulnerable - dt);
    if (crawler.phase === 'dormant') {
      if (intersects(player, CABLE_CRAWLER_ARENA.trigger)) startCableCrawler();
      return;
    }
    if (crawler.phase === 'cleared') return;

    updateCableCrawlerHazards(dt);
    if (!crawler.defeated) {
      const core = cableCrawlerCore();
      if (crawler.phase === 'vulnerable' && intersects(player, core)
        && heroCore.isStomp(player, core, { topTolerance: 52 })) {
        damageCableCrawler();
        return;
      }
      const body = cableCrawlerBody();
      if (intersects(player, body) && crawler.phase !== 'vulnerable' && crawler.phase !== 'hurt') {
        hurtPlayer(CABLE_CRAWLER_X);
      }
    }

    crawler.phaseTimer = Math.max(0, crawler.phaseTimer - dt);
    if (crawler.phaseTimer > 0) return;
    if (crawler.phase === 'intro' || crawler.phase === 'hurt') {
      enterCableCrawlerPhase('sweepCharge', 1.1);
    } else if (crawler.phase === 'sweepCharge') {
      enterCableCrawlerPhase('cableSweep', 1.55);
    } else if (crawler.phase === 'cableSweep') {
      enterCableCrawlerPhase('plugTelegraph', 1.2);
    } else if (crawler.phase === 'plugTelegraph') {
      enterCableCrawlerPhase('plugImpact', .5);
    } else if (crawler.phase === 'plugImpact') {
      enterCableCrawlerPhase('vulnerable', 2.75);
    } else if (crawler.phase === 'vulnerable') {
      enterCableCrawlerPhase('sweepCharge', 1.1);
    } else if (crawler.phase === 'defeated') {
      crawler.phase = 'cleared';
    }
  }

  function feedbackFiendBody() {
    return { x: FEEDBACK_FIEND_X - 96, y: GROUND_Y - 252, w: 192, h: 252 };
  }

  function feedbackFiendCore() {
    return { x: FEEDBACK_FIEND_X - 62, y: GROUND_Y - 168, w: 124, h: 76 };
  }

  function enterFeedbackFiendPhase(phase, duration) {
    const boss = game.boss;
    boss.phase = phase;
    boss.phaseTimer = duration;
    boss.lastAttack = phase;
    if (phase === 'shockCharge') {
      boss.attackCycle += 1;
      playAudio('boss.feedbackFiend.charge', { position: audioPosition(FEEDBACK_FIEND_X) });
    } else if (phase === 'feedbackDrop') {
      const playerCenter = clamp(player.x + player.w / 2, FEEDBACK_FIEND_ARENA.left + 90, FEEDBACK_FIEND_ARENA.right - 170);
      const direction = boss.attackCycle % 2 ? 1 : -1;
      boss.feedbackDrops = [
        { x: playerCenter, timer: 1.18, impact: 0, resolved: false },
        { x: clamp(playerCenter + direction * 190, FEEDBACK_FIEND_ARENA.left + 80, FEEDBACK_FIEND_ARENA.right - 180), timer: 1.52, impact: 0, resolved: false },
      ];
      playAudio('boss.feedbackFiend.dropWarn', { position: audioPosition(playerCenter) });
    } else if (phase === 'cableCharge') {
      playAudio('boss.feedbackFiend.cableWarn', { position: audioPosition(FEEDBACK_FIEND_X) });
    } else if (phase === 'cableSweep') {
      boss.cableSweep = { timer: duration, duration };
      playAudio('boss.feedbackFiend.cableSweep', { position: audioPosition(FEEDBACK_FIEND_X) });
    } else if (phase === 'vulnerable') {
      boss.invulnerable = 0;
      playAudio('boss.feedbackFiend.vulnerable', { position: audioPosition(FEEDBACK_FIEND_X) });
      showMessage('AMP CORE OPEN — STOMP THE FEEDBACK!', 1.7);
    }
  }

  function startFeedbackFiend() {
    const boss = game.boss;
    if (boss.defeated || boss.phase !== 'dormant') return;
    boss.startedAt = game.levelTime;
    boss.shockwaves.length = 0;
    boss.feedbackDrops.length = 0;
    boss.cableSweep = null;
    enterFeedbackFiendPhase('intro', 1.8);
    showMessage('THE FEEDBACK FIEND — TAME THE NOISE!', 2.25);
    playAudio('boss.feedbackFiend.enter', { position: audioPosition(FEEDBACK_FIEND_X) });
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 3 : 8);
  }

  function resetFeedbackFiendForRetry() {
    const retries = (game.boss.retryCount || 0) + 1;
    game.boss = createFeedbackFiendState();
    game.boss.retryCount = retries;
  }

  function spawnFeedbackFiendReward() {
    const boss = game.boss;
    if (boss.rewardSpawned) return;
    boss.rewardSpawned = true;
    for (let index = 0; index < 15; index += 1) {
      addTaco(
        FEEDBACK_FIEND_REWARD_X + (index % 8) * 36,
        GROUND_Y - 86 - Math.floor(index / 8) * 38 - Math.sin((index % 8) / 7 * Math.PI) * 46,
        index % 5 === 4 ? 'rainbow' : 'taco',
        { feedbackFiendReward: true, bonus: true },
      );
    }
  }

  function defeatFeedbackFiend() {
    const boss = game.boss;
    boss.defeated = true;
    boss.defeatedAt = game.levelTime;
    boss.health = 0;
    boss.gateOpen = false;
    boss.shockwaves.length = 0;
    boss.feedbackDrops.length = 0;
    boss.cableSweep = null;
    boss.phase = 'defeated';
    boss.phaseTimer = 2.05;
    game.score += 9000;
    game.energy = clamp(game.energy + 12, 0, 100);
    spawnFeedbackFiendReward();
    spawnConfetti(FEEDBACK_FIEND_X - game.cameraX, GROUND_Y - 150, game.reducedShake ? 70 : 150);
    spawnBurst(FEEDBACK_FIEND_X - game.cameraX, GROUND_Y - 150, '#50e7ff', game.reducedShake ? 18 : 42);
    spawnBurst(FEEDBACK_FIEND_X - game.cameraX, GROUND_Y - 130, '#ff4fac', game.reducedShake ? 14 : 34);
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 5 : 14);
    showMessage('FEEDBACK TAMED — CONCERT PATH OPENING!', 2.3);
    playAudio('boss.feedbackFiend.defeat', { position: audioPosition(FEEDBACK_FIEND_X) });
  }

  function damageFeedbackFiend() {
    const boss = game.boss;
    if (boss.phase !== 'vulnerable' || boss.invulnerable > 0 || boss.defeated) return;
    boss.health -= 1;
    boss.hitsTaken += 1;
    boss.invulnerable = .85;
    player.y = Math.min(player.y, feedbackFiendCore().y - player.h - 1);
    player.vy = -heroPhysics.enemyBounceVelocity;
    player.grounded = false;
    player.platform = null;
    game.score += 2600;
    game.energy = clamp(game.energy + 4, 0, 100);
    spawnBurst(FEEDBACK_FIEND_X - game.cameraX, GROUND_Y - 154, '#fff170', game.reducedShake ? 16 : 34);
    game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 4 : 10);
    playAudio('boss.feedbackFiend.damage', { position: audioPosition(FEEDBACK_FIEND_X), hit: boss.hitsTaken });
    if (boss.health <= 0) {
      defeatFeedbackFiend();
      return;
    }
    showMessage(`FEEDBACK FIEND OVERLOAD — ${boss.health} HIT${boss.health === 1 ? '' : 'S'} LEFT!`, 1.55);
    enterFeedbackFiendPhase('hurt', 1.05);
  }

  function updateFeedbackFiendHazards(dt) {
    const boss = game.boss;
    for (const wave of boss.shockwaves) {
      wave.x += wave.vx * dt;
      wave.life -= dt;
      if (!wave.hit && intersects(player, wave)) {
        wave.hit = true;
        hurtPlayer(FEEDBACK_FIEND_X);
      }
    }
    boss.shockwaves = boss.shockwaves.filter((wave) => wave.life > 0 && wave.x + wave.w > FEEDBACK_FIEND_ARENA.left - 120);

    for (const drop of boss.feedbackDrops) {
      if (drop.timer > 0) {
        drop.timer -= dt;
        if (drop.timer <= 0) {
          drop.impact = .34;
          spawnBurst(drop.x - game.cameraX, GROUND_Y - 8, '#ff4fac', game.reducedShake ? 8 : 18);
          playAudio('boss.feedbackFiend.dropImpact', { position: audioPosition(drop.x) });
        }
      } else if (drop.impact > 0) {
        drop.impact -= dt;
        const hazard = { x: drop.x - 42, y: GROUND_Y - 154, w: 84, h: 154 };
        if (!drop.resolved && intersects(player, hazard)) {
          drop.resolved = true;
          hurtPlayer(drop.x);
        }
      }
    }
    boss.feedbackDrops = boss.feedbackDrops.filter((drop) => drop.timer > 0 || drop.impact > 0);

    if (boss.cableSweep) {
      boss.cableSweep.timer = Math.max(0, boss.cableSweep.timer - dt);
      const progress = 1 - boss.cableSweep.timer / boss.cableSweep.duration;
      const sweepX = lerp(FEEDBACK_FIEND_X - 100, FEEDBACK_FIEND_ARENA.left + 60, smoothStep(progress));
      const hazard = { x: sweepX - 58, y: GROUND_Y - 104, w: 116, h: 40 };
      if (intersects(player, hazard)) hurtPlayer(sweepX);
      if (boss.cableSweep.timer <= 0) boss.cableSweep = null;
    }
  }

  function updateFeedbackFiend(dt) {
    const boss = game.boss;
    boss.invulnerable = Math.max(0, boss.invulnerable - dt);
    if (boss.phase === 'dormant') {
      if (player.x >= FEEDBACK_FIEND_ARENA.triggerX) startFeedbackFiend();
      return;
    }
    if (boss.phase === 'cleared') return;

    if (!boss.gateOpen) {
      player.x = clamp(player.x, FEEDBACK_FIEND_ARENA.left + 26, FEEDBACK_FIEND_ARENA.right - player.w - 30);
    }
    updateFeedbackFiendHazards(dt);

    if (!boss.defeated) {
      const core = feedbackFiendCore();
      if (boss.phase === 'vulnerable' && intersects(player, core)
        && heroCore.isStomp(player, core, { topTolerance: 58 })) {
        damageFeedbackFiend();
        return;
      }
      const body = feedbackFiendBody();
      if (intersects(player, body) && boss.phase !== 'vulnerable') hurtPlayer(FEEDBACK_FIEND_X);
    }

    boss.phaseTimer = Math.max(0, boss.phaseTimer - dt);
    if (boss.phaseTimer > 0) return;
    if (boss.phase === 'intro' || boss.phase === 'hurt') {
      enterFeedbackFiendPhase('shockCharge', 1.15);
    } else if (boss.phase === 'shockCharge') {
      boss.shockwaves.push({
        x: FEEDBACK_FIEND_X - 126, y: GROUND_Y - 50, w: 92, h: 46,
        vx: -340, life: 3.1, hit: false,
      });
      enterFeedbackFiendPhase('shockwave', 3.0);
      playAudio('boss.feedbackFiend.shockwave', { position: audioPosition(FEEDBACK_FIEND_X) });
      game.cameraShake = Math.max(game.cameraShake, game.reducedShake ? 2 : 6);
    } else if (boss.phase === 'shockwave') {
      enterFeedbackFiendPhase('feedbackDrop', 2.25);
    } else if (boss.phase === 'feedbackDrop') {
      enterFeedbackFiendPhase('cableCharge', 1.0);
    } else if (boss.phase === 'cableCharge') {
      enterFeedbackFiendPhase('cableSweep', 1.8);
    } else if (boss.phase === 'cableSweep') {
      enterFeedbackFiendPhase('vulnerable', 2.65);
    } else if (boss.phase === 'vulnerable') {
      enterFeedbackFiendPhase('shockCharge', 1.15);
    } else if (boss.phase === 'defeated') {
      boss.gateOpen = true;
      boss.phase = 'cleared';
      showMessage('THE CROWD IS JUST AHEAD — SHOWTIME!', 1.8);
      playAudio('concert.crowdCheer', { position: audioPosition(FEEDBACK_FIEND_ARENA.right + 300) });
    }
  }

  function updatePinata(dt) {
    const pinata = game.pinata;
    if (pinata.exploded) {
      pinata.explosionTimer = Math.max(0, pinata.explosionTimer - dt);
      return;
    }
    pinata.wobble *= .92;
    const target = { x: pinata.x - 54, y: GROUND_Y - 148, w: 108, h: 148 };
    if (!intersects(player, target) || player.vy < -40) return;
    if (!heroCore.isStomp(player, target, { topTolerance: 44 })) return;
    player.vy = -heroPhysics.enemyBounceVelocity;
    pinata.hits += 1;
    pinata.wobble = 1;
    playAudio('pinata.hit', {
      combo: pinata.hits,
      position: audioPosition(pinata.x),
    });
    showMessage(
      pinata.hits === 1 ? 'NEON PIÑATA CRACK! TWO MORE!'
        : pinata.hits === 2 ? 'NEON PIÑATA OVERLOADING! ONE MORE!'
          : 'KABOOM! MAXIMUM NEON TACO RAINBOW!',
      pinata.hits === 3 ? 2.8 : 1.35,
    );
    if (pinata.hits < 3) return;
    pinata.exploded = true;
    pinata.explosionTimer = 1.65;
    game.energy = clamp(game.energy + 18, 0, 100);
    game.score += 12000;
    game.cameraShake = game.reducedShake ? 10 : 28;
    game.hitStop = .2;
    const screenX = pinata.x - game.cameraX;
    const burstY = GROUND_Y - 78;
    spawnConfetti(screenX, burstY, game.reducedShake ? 140 : 320);
    ['#ff4fac', '#50e7ff', '#ffd65a', '#a4f766', '#b780ff'].forEach((color) => {
      spawnBurst(screenX, burstY, color, game.reducedShake ? 8 : 18);
    });
    spawnFireworks(game.reducedShake ? 7 : 14);
    game.impactTexts.push({
      x: screenX, y: GROUND_Y - 170, text: 'KABOOM!', color: '#fff170', life: 1.7,
    });
    for (let i = 0; i < 42; i += 1) {
      const type = i % 13 === 0 ? 'golden' : i % 7 === 3 ? 'rainbow' : 'taco';
      addTaco(
        pinata.x + (i - 20.5) * 19,
        340 - Math.sin(i / 41 * Math.PI) * 100,
        type,
        { bonus: true },
      );
    }
    playAudio('pinata.break', { position: audioPosition(pinata.x) });
  }

  function releaseBoatVolley() {
    const boat = game.boat;
    boat.pendingVolley = false;
    boat.throwCount += 1;
    boat.launchFlash = .22;
    for (let i = 0; i < 3; i += 1) {
      addTaco(boat.x + BOAT_LAUNCH_X_OFFSET - i * 18, BOAT_WATERLINE_Y + BOAT_LAUNCH_Y_OFFSET - i * 8, 'taco', {
        airborneDrop: true,
        vx: -220 - i * 38,
        vy: -185 - i * 24,
        spin: -(2.5 + i * .9),
        rotation: 0,
        bounces: 0,
        settled: false,
      });
    }
    playAudio('vehicle.tacoDrop', {
      vehicleType: 'catamaran',
      position: audioPosition(boat.x),
    });
  }

  function updateBoat(dt) {
    if (player.x < 22800 || player.x > 26800) {
      if (game.boat.active && player.x > 26800 && !game.boat.departedAudio) {
        game.boat.departedAudio = true;
        stopCatamaranLoop();
        playAudio('vehicle.depart', { vehicleType: 'catamaran', position: audioPosition(game.boat.x) });
      } else if (player.x < 22800) stopCatamaranLoop();
      return;
    }
    if (!game.boat.active) {
      game.boat.active = true;
      game.boat.x = player.x + BOAT_LEAD_DISTANCE;
      showMessage('OLIVIA IS AHEAD — CATCH THE TACOS COMING BACK!', 2.4);
      playAudio('vehicle.approach', { vehicleType: 'catamaran', position: audioPosition(game.boat.x) });
    }
    startCatamaranLoop(audioPosition(game.boat.x));
    game.boat.timer += dt;
    game.boat.launchFlash = Math.max(0, game.boat.launchFlash - dt);
    const targetX = player.x + BOAT_LEAD_DISTANCE;
    if (game.boat.x < targetX) {
      const forwardSpeed = Math.max(260, Math.max(0, player.vx) + 120);
      game.boat.x += Math.min(targetX - game.boat.x, forwardSpeed * dt);
    }
    if (Number.isFinite(previewBoatThrowProgress)) {
      game.boat.throwTimer = BOAT_THROW_DURATION
        * (1 - clamp(previewBoatThrowProgress, 0, .99));
      game.boat.pendingVolley = previewBoatThrowProgress < BOAT_THROW_RELEASE;
      game.boat.dropTimer = 999;
      return;
    }

    const previousThrowProgress = game.boat.throwTimer > 0
      ? 1 - game.boat.throwTimer / BOAT_THROW_DURATION
      : 1;
    game.boat.throwTimer = Math.max(0, game.boat.throwTimer - dt);
    const throwProgress = game.boat.throwTimer > 0
      ? 1 - game.boat.throwTimer / BOAT_THROW_DURATION
      : 1;
    if (
      game.boat.pendingVolley
      && previousThrowProgress < BOAT_THROW_RELEASE
      && throwProgress >= BOAT_THROW_RELEASE
    ) {
      releaseBoatVolley();
    }

    game.boat.dropTimer -= dt;
    if (game.boat.dropTimer <= 0 && game.boat.throwTimer <= 0) {
      game.boat.dropTimer = .82;
      game.boat.throwTimer = BOAT_THROW_DURATION;
      game.boat.pendingVolley = true;
    }
  }

  function announceSection(index) {
    const messages = [
      'SUNRISE SOUNDCHECK — SOMEBODY FIND THE BACKSTAGE PASSES!',
      'BACKSTAGE PASS BEACH — SURF, BOUNCE, COLLECT!',
      'ROADIE ROOFTOPS — THE FLOOR IS MOSTLY SPEAKER CABLES!',
      'SPEAKER STACK STAMPEDE — RUN WITH THE BASS!',
      'NEON LAGOON REHEARSAL — WATERFRONT SOUNDCHECK AHEAD!',
      'POWER UP THE STAGE — THREE TOWERS, MAXIMUM GLOW!',
      'PRE-SHOW SHOWDOWN — THE FEEDBACK FIEND BLOCKS THE CROWD!',
    ];
    showMessage(messages[index], 2.7);
    spawnConfetti(canvas.width * .62, 170, index === 6 ? 100 : 40);
  }

  function prepareConcert() {
    const concert = game.concert;
    concert.platforms = [
      { x: 0, y: GROUND_Y, w: 960, h: 100, style: 'concert-ground' },
      { x: 180, y: 380, w: 118, h: 22, style: 'beach-ball', moving: true, baseY: 380, phase: 0 },
      { x: 350, y: 318, w: 132, h: 22, style: 'note', moving: true, baseY: 318, phase: 1.2 },
      { x: 545, y: 372, w: 125, h: 22, style: 'speaker', moving: true, baseY: 372, phase: 2.4 },
      { x: 720, y: 300, w: 132, h: 22, style: 'taco-balloon', moving: true, baseY: 300, phase: 3.6 },
    ];
    concert.items = [];
    concert.chorusTacos = [];
    concert.chorusVolleys = new Set();
    concert.cannonFlash = 0;
    concert.controlRecoveries = 0;
    concert.lastSafeX = 110;
    concert.lastSafeY = GROUND_Y - player.h;
    for (let group = 0; group < 16; group += 1) {
      for (let index = 0; index < 8; index += 1) {
        concert.items.push({
          x: 120 + index * 92, y: 250 - Math.sin(index / 7 * Math.PI) * 95,
          w: 24, h: 24, collected: false, group,
        });
      }
    }
  }

  function spawnChorusTacoVolley(windowId, slot) {
    const concert = game.concert;
    const palette = slot % 3 === 2 ? 'rainbow' : 'taco';
    for (const side of [-1, 1]) {
      for (let index = 0; index < 4; index += 1) {
        const fromLeft = side === -1;
        concert.chorusTacos.push({
          x: fromLeft ? 40 + index * 11 : canvas.width - 64 - index * 11,
          y: 352 - index * 13,
          w: palette === 'rainbow' ? 30 : 26,
          h: palette === 'rainbow' ? 30 : 26,
          type: index === 3 && slot % 2 === 1 ? 'golden' : palette,
          bob: index * .7,
          vx: (fromLeft ? 1 : -1) * (155 + index * 33),
          vy: -310 - index * 38,
          spin: (fromLeft ? 1 : -1) * (2.4 + index * .7),
          rotation: 0,
          bounces: 0,
          age: 0,
          collected: false,
          chorus: true,
          windowId,
        });
      }
    }
    if (concert.chorusTacos.length > 24) {
      concert.chorusTacos = concert.chorusTacos.slice(-24);
    }
    concert.cannonFlash = .48;
    if (slot === 0) {
      showMessage('JUMP FOR TACOS! — CHORUS CANNONS!', 1.5);
      spawnConfetti(canvas.width / 2, 315, game.reducedShake ? 10 : 22);
    }
    playAudio('concert.chorusCannon', { volley: slot + 1, chorus: windowId });
  }

  function updateChorusTacos(dt) {
    const concert = game.concert;
    concert.cannonFlash = Math.max(0, concert.cannonFlash - dt);
    for (const windowDef of CHORUS_WINDOWS) {
      if (concert.timer < windowDef.start || concert.timer >= windowDef.end) continue;
      const slot = Math.floor((concert.timer - windowDef.start) / windowDef.interval);
      const key = `${windowDef.id}:${slot}`;
      if (!concert.chorusVolleys.has(key)) {
        concert.chorusVolleys.add(key);
        spawnChorusTacoVolley(windowDef.id, slot);
      }
    }
    for (const item of concert.chorusTacos) {
      if (item.collected) continue;
      item.age += dt;
      item.vy = Math.min(680, item.vy + 515 * dt);
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.rotation += item.spin * dt;
      if (item.y + item.h >= GROUND_Y - 2 && item.vy > 0) {
        item.y = GROUND_Y - item.h - 2;
        item.vy *= -.48;
        item.vx *= .82;
        item.bounces += 1;
        if (item.bounces >= 3) item.vy = 0;
      }
      if (intersects(player, item)) {
        item.collected = true;
        concert.collected += 1;
        game.collected += 1;
        game.score += item.type === 'golden' ? 700 : item.type === 'rainbow' ? 450 : 220;
        game.energy = clamp(game.energy + (item.type === 'taco' ? .35 : 1.1), 0, 100);
        spawnBurst(item.x + item.w / 2, item.y + item.h / 2, item.type === 'rainbow' ? '#ff4fac' : '#ffd65a', 8);
        const collectionEventId = item.type === 'golden' ? 'collect.goldenTaco'
          : item.type === 'rainbow' ? 'collect.rainbowTaco' : 'collect.taco';
        playAudio(collectionEventId, {
          streak: concert.collected,
          position: screenAudioPosition(item.x + item.w / 2),
          premiumType: item.type === 'golden' ? 'concertGolden'
            : item.type === 'rainbow' ? 'concertRainbow' : undefined,
        });
        const superStarted = abilities.collectTaco(game.abilities, item.type, { position: screenAudioPosition(item.x + item.w / 2) });
        if (superStarted) {
          announceSuper();
          if (item.type === 'golden') showMessage('GOLDEN CONCERT TACO — SUPER TACO HERO!', 2.1);
        }
      }
    }
    concert.chorusTacos = concert.chorusTacos.filter((item) => !item.collected && item.age < 13);
  }

  function recoverConcertPlayer() {
    const concert = game.concert;
    player.x = clamp(concert.lastSafeX || 110, 36, canvas.width - player.w - 36);
    player.y = Math.min(concert.lastSafeY || GROUND_Y - player.h, GROUND_Y - player.h);
    player.vx = 0;
    player.vy = 0;
    player.grounded = true;
    player.platform = concert.platforms[0] || null;
    player.jumpBuffer = 0;
    concert.controlRecoveries += 1;
  }

  function startConcert(startAt = 0, entryDecision = null) {
    if (game.concert.started) return;
    const decision = entryDecision || resolveConcertEntry(
      CONCERT_ENTRY_TRIGGER_X,
      game.score,
      getConcertEntryStatus(),
    );
    const exploredSystems = WORLD23_PHASE2_VISIBLE_IDS.filter((id) => world23Phase2Station(id)?.completed);
    const fallbackSystems = WORLD23_PHASE2_VISIBLE_IDS.filter((id) => !exploredSystems.includes(id));
    game.concert.venueSystems = {
      ready: true,
      exploredSystems,
      fallbackSystems,
      automaticConcertFallback: fallbackSystems.length > 0,
      marquee: true,
      sound: true,
      lights: true,
      backstage: true,
    };
    game.phase2.concertFallbackSystems = [...fallbackSystems];
    game.phase2.preShowHidden = true;
    game.cableCrawler.concertFallbackPowered = !game.cableCrawler.defeated;
    game.cableCrawler.utilityPowered = true;
    game.cableCrawler.phase = 'cleared';
    game.cableCrawler.sweep = null;
    game.cableCrawler.plugTargets.length = 0;
    game.boss.defeated = true;
    game.boss.gateOpen = true;
    game.boss.phase = 'cleared';
    game.boss.shockwaves.length = 0;
    game.boss.feedbackDrops.length = 0;
    game.boss.cableSweep = null;
    world.phase2Stations.forEach((station) => { station.dialogueTimer = 0; });
    world.bandCameos.forEach((cameo) => { cameo.dialogueTimer = 0; });
    stopRoadsterLoop();
    stopCatamaranLoop();
    game.state = 'concert';
    game.concert.started = true;
    game.concert.entryReason = decision.entryReason;
    game.concert.entryDecision = { ...decision };
    game.concert.skipped = false;
    game.concert.skippedAt = 0;
    game.concert.timer = clamp(startAt, 0, game.concert.duration - .2);
    ui.skipConcertBtn.hidden = true;
    prepareConcert();
    player.x = 110;
    player.y = GROUND_Y - player.h;
    player.vx = 0;
    player.vy = 0;
    player.grounded = true;
    player.platform = game.concert.platforms[0];
    try {
      tracks.concert.currentTime = game.concert.timer;
    } catch {
      tracks.concert.addEventListener('loadedmetadata', () => {
        tracks.concert.currentTime = game.concert.timer;
      }, { once: true });
    }
    setMusic('concert');
    showMessage('THE NEON NECKTIES — JUMP FOR TACOS!', 3.4);
    spawnConfetti(canvas.width / 2, 170, 140);
    playAudio('concert.start');
    playAudio('concert.crowdCheer');
  }

  function updateConcert(dt) {
    const concert = game.concert;
    concert.timer = Number.isFinite(tracks.concert.currentTime) && !tracks.concert.paused
      ? tracks.concert.currentTime : concert.timer + dt;
    concert.platforms.forEach((platform, index) => {
      if (!platform.moving) return;
      const oldY = platform.y;
      platform.y = platform.baseY + Math.sin(concert.timer * (1.1 + index * .08) + platform.phase) * 20;
      platform.dy = platform.y - oldY;
    });
    updatePlayer(dt, true);
    updateChorusTacos(dt);

    const invalidPosition = !Number.isFinite(player.x) || !Number.isFinite(player.y)
      || player.y < -80 || player.y > canvas.height + 40;
    if (invalidPosition) recoverConcertPlayer();
    else if (player.grounded && player.y >= 250 && player.y <= GROUND_Y - player.h + 4) {
      concert.lastSafeX = player.x;
      concert.lastSafeY = player.y;
    }

    const group = Math.floor(concert.timer / 11.5);
    for (const item of concert.items) {
      if (item.group !== group || item.collected) continue;
      if (intersects(player, item)) {
        item.collected = true;
        concert.collected += 1;
        game.score += 150;
        game.energy = clamp(game.energy + .12, 0, 100);
        playAudio('collect.taco', {
          streak: concert.collected,
          position: screenAudioPosition(item.x + item.w / 2),
        });
      }
    }
    ui.skipConcertBtn.hidden = concert.timer < 60;
    const nextCue = [15, 30, 47, 64, 68, 142, 168].findIndex((time) => concert.timer < time);
    const cueIndex = nextCue < 0 ? 7 : nextCue;
    if (cueIndex !== concert.cueIndex) {
      concert.cueIndex = cueIndex;
      const cueMessages = [
        'STAGE LIGHTS RISE!', 'FIRST VERSE — THE CROWD IS READY!',
        'HANDS UP — OLIVIA IS CROWD SURFING!', 'RETURN TRIP — OLIVIA IS SURFING BACK!',
        'SAFE LANDING — CROWD CHEER!', 'TACO TAMBOURINE SOLO!',
        'FINALE LIFT — FIREWORKS ARMED!', 'NEON ENCORE — ONE MORE TACO!',
      ];
      showMessage(cueMessages[cueIndex], 2.1);
      const cueEventId = [
        null,
        'concert.crowdCheer',
        'concert.crowdSurfStart',
        'concert.crowdSurfStart',
        'concert.crowdSurfLand',
        'concert.tambourineAccent',
        'concert.finaleLift',
        'concert.crowdCheer',
      ][cueIndex];
      if (cueEventId) playAudio(cueEventId, {
        cue: cueIndex,
        direction: cueIndex === 3 ? 'return' : undefined,
      });
      if (cueIndex >= 3) spawnConfetti(canvas.width / 2, 160, game.reducedShake ? 45 : 95);
      if (cueIndex >= 6) spawnFireworks(8 + cueIndex * 2);
    }
    if (concert.timer >= concert.duration - .15 || tracks.concert.ended) finishLevel();
  }

  function skipConcert() {
    if (game.state !== 'concert' || game.concert.timer < 60) return;
    game.concert.skipped = true;
    game.concert.skippedAt = game.concert.timer;
    ui.skipConcertBtn.hidden = true;
    tracks.concert.pause();
    tracks.concert.volume = 0;
    game.activeMusic = null;
    game.musicTransition = null;
    playAudio('ui.confirm');
    finishLevel();
  }

  function finishLevel() {
    if (game.state === 'results') return;
    game.state = 'results';
    if (!game.concert.skipped) playAudio('concert.bow');
    playAudio('level.complete');
    game.finishTime = performance.now();
    ui.skipConcertBtn.hidden = true;
    const concertSeconds = Math.min(
      game.concert.duration,
      game.concert.skipped ? game.concert.skippedAt : game.concert.timer,
    );
    const adventureSeconds = (game.finishTime - game.startTime) / 1000 - concertSeconds;
    const seconds = Math.max(0, adventureSeconds);
    const energy = Math.round(game.energy);
    let medal = 'TIE-HARD FAN';
    if (energy >= 90) medal = 'NEON ENCORE LEGEND';
    else if (energy >= 70) medal = 'BACKSTAGE HERO';
    else if (energy >= 45) medal = 'SUNSET SUPERFAN';
    ui.medalBadge.textContent = medal;
    ui.resultScore.textContent = game.score.toLocaleString();
    ui.resultTime.textContent = formatTime(seconds);
    ui.resultTacos.textContent = `${game.collected}/${game.totalTacos}`;
    ui.resultGolden.textContent = `${Math.min(game.golden, game.totalGolden)}/${game.totalGolden}`;
    ui.resultEnergy.textContent = `${energy}%`;
    ui.resultConcert.textContent = game.concert.skipped ? `${formatTime(concertSeconds)} played` : 'Full 3:07';
    ui.winText.textContent = game.concert.skipped
      ? `You powered ${game.generators}/3 stage towers, caught ${game.boat.catches || 0} airborne taco drops, and collected ${game.concert.collected} concert tacos. Olivia calls this a strategic encore exit. The full show is waiting whenever you replay.`
      : `You powered ${game.generators}/3 stage towers, caught ${game.boat.catches || 0} airborne taco drops, collected ${game.concert.collected} concert tacos, and stayed through the Neon Neckties bow. Olivia has already requested an encore and another taco.`;
    const best = game.personalBest;
    const newBest = !best.runs || game.score > best.score;
    if (newBest) {
      game.personalBest = { score: game.score, time: seconds, energy, runs: best.runs + 1 };
      ui.newBestText.classList.remove('hidden');
    } else {
      game.personalBest.runs += 1;
      ui.newBestText.classList.add('hidden');
    }
    saveProgress();
    ui.winOverlay.classList.remove('hidden');
    ui.winOverlay.classList.add('visible');
    requestAnimationFrame(() => ui.winOverlay.querySelector('[data-next-level]')?.focus());
  }

  function update(dt) {
    updateMusic(dt);
    if (game.settingsOpen) return;
    game.messageTimer = Math.max(0, game.messageTimer - dt);
    game.splatTimer = Math.max(0, game.splatTimer - dt);
    if (game.splatTimer <= 0) game.splatCombo = 0;
    game.cameraShake = Math.max(0, game.cameraShake - dt * 38);
    if (game.hitStop > 0) { game.hitStop = Math.max(0, game.hitStop - dt); updateEffects(dt * .2); return; }
    const frenzyWasActive = abilities.isFrenzy(game.abilities);
    const magnetWasActive = abilities.hasMagnet(game.abilities);
    abilities.update(game.abilities, dt);
    if (frenzyWasActive && !abilities.isFrenzy(game.abilities)) playAudio('ability.frenzyEnd');
    if (magnetWasActive && !abilities.hasMagnet(game.abilities)) playAudio('ability.magnetEnd');
    if (game.state === 'respawning') {
      updateRespawn(dt);
      updateEffects(dt);
      return;
    }
    if (game.state === 'concert') {
      game.levelTime += dt;
      updateConcert(dt);
      updateEffects(dt);
      return;
    }
    if (game.state !== 'playing') {
      updateEffects(dt * .3);
      return;
    }
    game.levelTime += dt;
    updateOpeningScene(dt);
    updateMovingPlatforms();
    updatePlayer(dt);
    updateWorld23Phase2(dt);
    updateCableCrawler(dt);
    updateFeedbackFiend(dt);
    updateEnemies(dt);
    updateCollectibles(dt);
    updateCheckpoints();
    updateGenerators();
    updatePinata(dt);
    updateBoat(dt);
    updateEffects(dt);

    const nextSection = sections.findIndex((section) => player.x >= section.start && player.x < section.end);
    if (nextSection !== game.sectionIndex) {
      game.sectionIndex = nextSection;
      setMusic(sections[nextSection].music);
      announceSection(nextSection);
    }
    const fastCamera = ['stampede', 'victory'].includes(currentSection().id);
    const bossCameraActive = game.boss.phase !== 'dormant' && game.boss.phase !== 'cleared' && !game.boss.gateOpen;
    const cameraTarget = bossCameraActive
      ? (FEEDBACK_FIEND_ARENA.left + FEEDBACK_FIEND_ARENA.right) / 2 - canvas.width / 2
      : player.x - canvas.width * (fastCamera ? .34 : .42);
    game.cameraX = lerp(
      game.cameraX,
      clamp(cameraTarget, 0, WORLD_WIDTH - canvas.width),
      Math.min(1, dt * (bossCameraActive ? 6 : 9)),
    );
    const concertEntryStatus = getConcertEntryStatus();
    const concertEntry = resolveConcertEntry(player.x, game.score, concertEntryStatus);
    if (concertEntry.shouldStart) startConcert(0, concertEntry);
  }

  function spawnParticle(x, y, color, amount = 1) {
    for (let i = 0; i < amount; i += 1) {
      game.particles.push({
        x, y, vx: (random() - .5) * 220, vy: -50 - random() * 210,
        gravity: 520, life: .55 + random() * .8, size: 3 + random() * 5, color,
      });
    }
  }

  function spawnBurst(x, y, color, amount = 15) {
    spawnParticle(x, y, color, amount);
  }

  function spawnConfetti(x, y, amount = 40) {
    const colors = ['#ff4fac', '#50e7ff', '#a4f766', '#ffd65a', '#b780ff', '#fff7dc'];
    for (let i = 0; i < amount; i += 1) {
      game.confetti.push({
        x, y, vx: (random() - .5) * 420, vy: -100 - random() * 400,
        gravity: 700 + random() * 260, life: 1 + random() * 1.5,
        size: 4 + random() * 7, color: colors[i % colors.length], angle: random() * Math.PI * 2,
      });
    }
  }

  function spawnFireworks(amount = 8) {
    const colors = ['#ff4fac', '#50e7ff', '#ffd65a', '#a4f766', '#b780ff'];
    for (let i = 0; i < amount; i += 1) {
      game.fireworks.push({
        x: 80 + random() * 800, y: 60 + random() * 210, color: colors[i % colors.length],
        radius: 0, life: 1.4 + random(), delay: random() * 1.1,
      });
    }
  }

  function updateEffects(dt) {
    for (const particle of game.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
      particle.life -= dt;
    }
    game.particles = game.particles.filter((particle) => particle.life > 0);
    for (const piece of game.confetti) {
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.vy += piece.gravity * dt;
      piece.angle += dt * 8;
      piece.life -= dt;
    }
    game.confetti = game.confetti.filter((piece) => piece.life > 0);
    game.impactTexts.forEach((text) => { text.y -= dt * 42; text.life -= dt; });
    game.impactTexts = game.impactTexts.filter((text) => text.life > 0);
    game.fireworks.forEach((firework) => {
      firework.delay -= dt;
      if (firework.delay <= 0) { firework.radius += dt * 88; firework.life -= dt; }
    });
    game.fireworks = game.fireworks.filter((firework) => firework.life > 0);
  }

  function roundedRect(x, y, w, h, radius, fill, stroke = null, lineWidth = 2) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  function environmentBlendState(worldX) {
    const halfTransition = ENVIRONMENT_TRANSITION_WIDTH / 2;
    for (let index = 1; index < sections.length; index += 1) {
      const boundary = sections[index].start;
      if (worldX < boundary - halfTransition || worldX > boundary + halfTransition) continue;
      return {
        from: sections[index - 1],
        to: sections[index],
        amount: smoothStep((worldX - (boundary - halfTransition)) / ENVIRONMENT_TRANSITION_WIDTH),
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
    if (sourceHeight > image.height * .95) {
      sourceHeight = image.height * .95;
      sourceWidth = sourceHeight * canvasAspect;
    }
    const progress = sectionProgress(section, worldX);
    const sourceX = (image.width - sourceWidth) * progress;
    const sourceYBias = section.id === 'rooftops' ? .42 : section.id === 'victory' ? .5 : .46;
    const sourceY = (image.height - sourceHeight) * sourceYBias;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    return true;
  }

  function drawPaintedEnvironment(time) {
    const blend = environmentBlendState(player.x);
    const fromImage = images[environmentImageKeys[blend.from.id]];
    const toImage = images[environmentImageKeys[blend.to.id]];
    if (!fromImage || !toImage) return false;
    drawEnvironmentPlate(fromImage, blend.from, player.x, blend.from === blend.to ? 1 : 1 - blend.amount);
    if (blend.from !== blend.to) drawEnvironmentPlate(toImage, blend.to, player.x, blend.amount);

    const progress = player.x / WORLD_WIDTH;
    const night = smoothStep((progress - .62) / .24);
    const grade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grade.addColorStop(0, `rgba(10,12,55,${night * .12})`);
    grade.addColorStop(.58, 'rgba(21,13,55,0)');
    grade.addColorStop(1, `rgba(4,14,37,${.07 + night * .13})`);
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // The venue grows more alive as the route approaches the stage. These
    // restrained particles sit behind gameplay and never become hazards.
    const activeSection = blend.amount > .5 ? blend.to : blend.from;
    const particleCount = game.reducedShake ? 6 : 12;
    if (['stampede', 'lagoon', 'powerup', 'victory'].includes(activeSection.id)) {
      ctx.save();
      for (let index = 0; index < particleCount; index += 1) {
        const cycle = (time * (.000035 + index % 3 * .000008) + index * .137) % 1;
        const x = ((index * 173 - game.cameraX * .055) % 1100 + 1100) % 1100 - 60;
        const y = 430 - cycle * 340;
        ctx.globalAlpha = .05 + (1 - cycle) * .12;
        ctx.fillStyle = index % 3 === 0 ? '#ffd65a' : index % 2 ? '#50e7ff' : '#ff4fac';
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + index % 3, 0, Math.PI * 2);
        ctx.fill();
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

  function drawBackground(time) {
    const progress = player.x / WORLD_WIDTH;
    if (drawPaintedEnvironment(time)) {
      drawTimeOfDayAtmosphere(progress);
      return;
    }
    if (images.farSky) {
      ctx.drawImage(images.farSky, 0, 0, images.farSky.width, images.farSky.height, 0, 0, canvas.width, canvas.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, progress > .65 ? '#283d75' : '#f07c8d');
      gradient.addColorStop(1, progress > .65 ? '#101b43' : '#6f3159');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawMidgroundParallax();
    drawNearSceneryParallax();
    if (!images.midground && currentSection().id === 'lagoon') drawLagoonBackdrop(time);
    drawTimeOfDayAtmosphere(progress);
  }

  function drawTimeOfDayAtmosphere(progress) {
    const dusk = smoothStep((progress - .55) / .16);
    const night = smoothStep((progress - .76) / .18);
    const warmth = 1 - dusk;

    // One shared color grade covers every background depth. That keeps the far
    // sky, village, lagoon and near scenery in the same time of day instead of
    // revealing where one illustration ends and the next begins.
    const atmosphere = ctx.createLinearGradient(0, 0, 0, canvas.height);
    atmosphere.addColorStop(0, `rgba(10,14,63,${.03 + dusk * .2 + night * .31})`);
    atmosphere.addColorStop(.58, `rgba(59,27,83,${.02 + dusk * .14 + night * .18})`);
    atmosphere.addColorStop(1, `rgba(4,22,56,${dusk * .12 + night * .23})`);
    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (warmth > 0) {
      const sunsetGlow = ctx.createRadialGradient(100, 370, 20, 100, 370, 460);
      sunsetGlow.addColorStop(0, `rgba(255,184,84,${warmth * .11})`);
      sunsetGlow.addColorStop(1, 'rgba(255,109,139,0)');
      ctx.fillStyle = sunsetGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function drawMidgroundPanel(name, alpha, shift) {
    const source = midgroundFrames[name];
    if (!midgroundPanelCache[name]) {
      // Keep the illustrated village, lagoon, and concert horizon, but discard
      // their baked-in upper skies. The shared far-sky layer can then remain
      // continuous through every time-of-day transition.
      const cropTop = {
        village: 52,
        lagoon: 72,
        concert: 76,
      }[name] || 52;
      const sourceHeight = source[3] - cropTop;
      const panel = document.createElement('canvas');
      panel.width = 1135;
      panel.height = Math.round(MIDGROUND_PANEL_HEIGHT * (sourceHeight / source[3]));
      const panelContext = panel.getContext('2d');
      panelContext.imageSmoothingEnabled = true;
      panelContext.drawImage(
        images.midground,
        source[0], source[1] + cropTop, source[2], sourceHeight,
        0, 0, panel.width, panel.height,
      );
      panelContext.globalCompositeOperation = 'destination-in';
      const featherHeight = Math.min(54, Math.round(panel.height * .38));
      const feather = panelContext.createLinearGradient(0, 0, 0, featherHeight);
      feather.addColorStop(0, 'rgba(255,255,255,0)');
      feather.addColorStop(.22, 'rgba(255,255,255,.08)');
      feather.addColorStop(.62, 'rgba(255,255,255,.52)');
      feather.addColorStop(1, 'rgba(255,255,255,1)');
      panelContext.fillStyle = feather;
      // The gradient holds its final opaque stop below featherHeight. Filling
      // the complete panel preserves the village and shoreline while fading
      // only the competing sky at the top.
      panelContext.fillRect(0, 0, panel.width, panel.height);
      panelContext.globalCompositeOperation = 'source-over';
      midgroundPanelCache[name] = panel;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    const panel = midgroundPanelCache[name];
    ctx.drawImage(panel, shift, GROUND_Y - panel.height);
    ctx.restore();
  }

  function drawMidgroundParallax() {
    if (!images.midground) return;
    const x = player.x;
    const transitionWidth = 760;
    let first = 'village';
    let second = null;
    let blend = 0;
    if (x >= 22500 - transitionWidth && x < 22500) {
      second = 'lagoon';
      blend = (x - (22500 - transitionWidth)) / transitionWidth;
    } else if (x >= 22500 && x < 28000 - transitionWidth) {
      first = 'lagoon';
    } else if (x >= 28000 - transitionWidth && x < 28000) {
      first = 'lagoon';
      second = 'concert';
      blend = (x - (28000 - transitionWidth)) / transitionWidth;
    } else if (x >= 28000) {
      first = 'concert';
    }
    const drawPanel = (name, alpha) => {
      const shift = -((game.cameraX * .035) % 135) - 30;
      drawMidgroundPanel(name, alpha, shift);
    };
    drawPanel(first, second ? 1 - blend : 1);
    if (second) drawPanel(second, blend);
  }

  function drawNearSceneryParallax() {
    if (!images.nearScenery) return;
    for (const section of sections) {
      const source = nearSceneryFrames[section.id];
      const sourceRatio = source[2] / source[3];
      const visualHeight = ['lagoon', 'powerup', 'victory'].includes(section.id) ? 238 : 252;
      const visualWidth = visualHeight * sourceRatio;
      const sourceScale = visualHeight / source[3];
      const groundOffset = nearSceneryBottomInsets[section.id] * sourceScale;
      for (let worldX = section.start + 460; worldX < section.end + 500; worldX += 1180) {
        const screenX = worldX - section.start - (game.cameraX - section.start) * .82;
        if (screenX + visualWidth < -100 || screenX > canvas.width + 100) continue;
        ctx.drawImage(
          images.nearScenery,
          ...source,
          screenX,
          GROUND_Y - visualHeight + groundOffset,
          visualWidth,
          visualHeight,
        );
      }
    }
  }

  function drawVillageBackdrop(time) {
    const firstHouse = 10800;
    const lastHouse = 22400;
    const start = Math.max(firstHouse, Math.floor((game.cameraX - 300) / 520) * 520);
    for (let worldX = start; worldX < game.cameraX + canvas.width + 500 && worldX < lastHouse; worldX += 520) {
      const x = worldX - game.cameraX * .83;
      const height = 90 + ((worldX / 520) % 3) * 22;
      ctx.fillStyle = 'rgba(38,25,72,.45)';
      roundedRect(x, 410 - height, 290, height, 18, 'rgba(38,25,72,.46)', 'rgba(255,188,164,.16)');
      ctx.fillStyle = 'rgba(255,213,125,.38)';
      for (let windowIndex = 0; windowIndex < 3; windowIndex += 1) {
        roundedRect(x + 35 + windowIndex * 78, 355 - height / 2, 38, 30, 7, 'rgba(255,213,125,.34)');
      }
      ctx.fillStyle = 'rgba(255,79,172,.3)';
      ctx.beginPath();
      ctx.moveTo(x - 15, 410 - height);
      ctx.lineTo(x + 145, 270 - height * .3);
      ctx.lineTo(x + 305, 410 - height);
      ctx.fill();
    }
  }

  function drawLagoonBackdrop(time) {
    ctx.fillStyle = 'rgba(39,220,230,.2)';
    ctx.fillRect(0, 425, canvas.width, 115);
    for (let y = 432; y < 520; y += 18) {
      ctx.strokeStyle = `rgba(80,231,255,${.14 + (y % 3) * .02})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 28) {
        const wave = Math.sin(x * .028 + time * .002 + y) * 5;
        if (!x) ctx.moveTo(x, y + wave); else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
  }

  function drawStageSkyline(time) {
    const distance = clamp((player.x - 28000) / 7000, 0, 1);
    const center = 750 - distance * 250;
    ctx.save();
    ctx.globalAlpha = .25 + distance * .65;
    ctx.strokeStyle = '#50e7ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(center - 180, 175, 360, 225);
    ctx.fillStyle = 'rgba(255,79,172,.14)';
    ctx.fillRect(center - 170, 185, 340, 205);
    ctx.font = '900 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff4be';
    ctx.fillText('NEON NECKTIES', center, 235);
    for (let i = 0; i < 5; i += 1) {
      ctx.strokeStyle = band[i].color;
      ctx.beginPath();
      ctx.moveTo(center - 120 + i * 60, 180);
      ctx.lineTo(center - 160 + i * 80 + Math.sin(time * .002 + i) * 25, 70);
      ctx.stroke();
    }
    ctx.restore();
  }

  function remasteredTerrainColors(sectionId) {
    return {
      soundcheck: ['#ffe286', '#6e9b66', '#2b4051'],
      beach: ['#fff0a2', '#d99064', '#62405b'],
      rooftops: ['#ffc685', '#aa655b', '#402d58'],
      stampede: ['#b6ff82', '#55486f', '#211b43'],
      lagoon: ['#a8ffff', '#2789a9', '#123d6c'],
      powerup: ['#c9a0ff', '#583d82', '#211644'],
      victory: ['#fff19a', '#b9659a', '#382051'],
    }[sectionId] || ['#fff0a2', '#8c6a83', '#39274f'];
  }

  function drawRemasteredPlatform(platform, time) {
    if (!images.terrainRemaster) return false;
    const section = currentSection(platform.x + platform.w / 2);
    const rowIndex = terrainRows[section.id] ?? 0;
    const atlas = images.terrainRemaster;
    const rowHeight = atlas.height / 7;
    const columnWidth = atlas.width / 2;
    const ground = Boolean(platform.ground);
    const sourceColumnX = ground ? 0 : columnWidth;
    const screenX = Math.floor(platform.x - game.cameraX);
    const screenY = Math.floor(platform.y);
    const visualTop = screenY - (ground ? 3 : 8);
    const visualHeight = ground ? Math.max(platform.h + 4, 94) : Math.max(platform.h + 34, 58);
    const tileWidth = ground ? 286 : 216;
    const sourceTileWidth = Math.min(columnWidth - 2, ground ? 620 : 540);
    const maxSourceOffset = Math.max(1, columnWidth - sourceTileWidth - 2);
    const colors = remasteredTerrainColors(section.id);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.beginPath();
    ctx.roundRect(screenX, visualTop, platform.w, visualHeight, ground ? 7 : 14);
    ctx.clip();
    for (let offset = 0, tile = 0; offset < platform.w; offset += tileWidth, tile += 1) {
      const drawWidth = Math.min(tileWidth + 1, platform.w - offset);
      const seedOffset = Math.abs(Math.floor(platform.x * .31 + tile * 421 + rowIndex * 197));
      const sourceX = sourceColumnX + 1 + seedOffset % maxSourceOffset;
      ctx.drawImage(
        atlas,
        sourceX, rowIndex * rowHeight + 18, sourceTileWidth, rowHeight - 30,
        screenX + offset, visualTop, drawWidth, visualHeight,
      );
    }
    const shade = ctx.createLinearGradient(0, visualTop, 0, visualTop + visualHeight);
    shade.addColorStop(0, 'rgba(255,255,255,.08)');
    shade.addColorStop(.36, 'rgba(255,255,255,0)');
    shade.addColorStop(1, ground ? 'rgba(10,13,34,.16)' : 'rgba(8,10,28,.3)');
    ctx.fillStyle = shade;
    ctx.fillRect(screenX, visualTop, platform.w, visualHeight);
    ctx.restore();

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(screenX, visualTop, platform.w, visualHeight, ground ? 7 : 14);
    ctx.stroke();
    ctx.strokeStyle = colors[0];
    ctx.globalAlpha = .72;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(screenX + 10, screenY);
    ctx.lineTo(screenX + platform.w - 10, screenY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (!ground) {
      ctx.fillStyle = 'rgba(11,8,34,.24)';
      ctx.beginPath();
      ctx.ellipse(screenX + platform.w / 2, visualTop + visualHeight + 9, Math.max(28, platform.w * .38), 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = section.accent;
      ctx.globalAlpha = .52;
      ctx.lineWidth = 2;
      for (const endX of [screenX + 9, screenX + platform.w - 9]) {
        ctx.beginPath();
        ctx.moveTo(endX, visualTop + 10);
        ctx.lineTo(endX, visualTop + visualHeight - 9);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Deterministic route-specific construction details make long platforms
    // feel authored without placing clutter in the collision lane.
    const detailGap = ground ? 112 : 86;
    for (let detail = screenX + 34; detail < screenX + platform.w - 20; detail += detailGap) {
      if (section.id === 'soundcheck') {
        ctx.strokeStyle = 'rgba(44,44,70,.62)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(detail, screenY + 34, 13, .2, Math.PI * 1.8); ctx.stroke();
      } else if (section.id === 'beach') {
        ctx.fillStyle = detail % 2 ? '#ff9d7d' : '#ffe286';
        ctx.beginPath(); ctx.arc(detail, screenY + 10, 3, 0, Math.PI * 2); ctx.fill();
      } else if (section.id === 'rooftops') {
        ctx.fillStyle = detail % 2 ? 'rgba(255,79,172,.62)' : 'rgba(80,231,255,.62)';
        ctx.fillRect(detail - 12, screenY + 18, 24, 5);
      } else if (section.id === 'stampede') {
        ctx.strokeStyle = 'rgba(164,247,102,.6)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(detail, screenY + 34, 10, 0, Math.PI * 2); ctx.stroke();
      } else if (section.id === 'lagoon') {
        ctx.fillStyle = 'rgba(80,231,255,.66)';
        ctx.beginPath(); ctx.roundRect(detail - 15, screenY + 12, 30, 4, 2); ctx.fill();
      } else if (section.id === 'powerup') {
        ctx.strokeStyle = detail % 2 ? '#ff4fac' : '#50e7ff';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(detail - 14, screenY + 27); ctx.lineTo(detail, screenY + 17); ctx.lineTo(detail + 14, screenY + 27); ctx.stroke();
      } else {
        ctx.fillStyle = detail % 2 ? '#ffd65a' : '#ff4fac';
        ctx.beginPath(); ctx.arc(detail, screenY + 14, 3.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (platform.moving) {
      ctx.fillStyle = 'rgba(255,255,255,.86)';
      const pulse = 3 + Math.sin(time * .008 + platform.phase) * 1.5;
      for (const markerX of [screenX + 13, screenX + platform.w - 13]) {
        ctx.shadowColor = section.accent;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(markerX, screenY + platform.h / 2, pulse, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
    game.foregroundRemasterReady = true;
    return true;
  }

  function drawPhase2Truss(x, y, width, height, accent) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#19152f';
    ctx.lineWidth = 8;
    ctx.strokeRect(x, y, width, height);
    ctx.strokeStyle = accent;
    ctx.globalAlpha = .72;
    ctx.lineWidth = 2.5;
    for (let offset = 0; offset < width; offset += 46) {
      ctx.beginPath();
      ctx.moveTo(x + offset, y + 2);
      ctx.lineTo(x + Math.min(width, offset + 46), y + height - 2);
      ctx.moveTo(x + Math.min(width, offset + 46), y + 2);
      ctx.lineTo(x + offset, y + height - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPhase2SpeakerCabinet(x, y, width, height, pulse, accent) {
    ctx.save();
    roundedRect(x, y, width, height, 10, '#151427', '#554c71', 3);
    const coneRows = height > 82 ? 2 : 1;
    for (let row = 0; row < coneRows; row += 1) {
      const radius = Math.min(width * .29, height / coneRows * .31) * (1 + pulse * .08);
      const cy = y + (row + .5) * height / coneRows;
      const cx = x + width / 2;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 6 + pulse * 14;
      ctx.fillStyle = '#25213d';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = pulse > .35 ? accent : '#4a4563';
      ctx.beginPath(); ctx.arc(cx, cy, radius * .28, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd65a';
    ctx.beginPath(); ctx.arc(x + width - 10, y + 10, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawRoadieSpeakerCabinet(x, y, width, height, pulse, accent, { launch = false } = {}) {
    ctx.save();
    const extrusion = Math.max(7, width * .07);
    const shell = ctx.createLinearGradient(x, y, x + width, y + height);
    shell.addColorStop(0, '#45485b');
    shell.addColorStop(.18, '#171827');
    shell.addColorStop(.78, '#0b0d18');
    shell.addColorStop(1, '#343347');
    ctx.fillStyle = '#090a12';
    ctx.beginPath();
    ctx.moveTo(x + width, y + 7);
    ctx.lineTo(x + width + extrusion, y + 14);
    ctx.lineTo(x + width + extrusion, y + height - 7);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
    roundedRect(x, y, width, height, 9, shell, '#070812', 4);
    roundedRect(x + 8, y + 10, width - 16, height - 24, 6, '#10111d', '#63677b', 2);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x + 11, y + 13, width - 22, height - 30, 5);
    ctx.clip();
    ctx.strokeStyle = 'rgba(158,166,184,.16)';
    ctx.lineWidth = 1;
    for (let grille = x - height; grille < x + width + height; grille += 7) {
      ctx.beginPath(); ctx.moveTo(grille, y + 11); ctx.lineTo(grille + height, y + height - 12); ctx.stroke();
    }
    ctx.restore();
    const coneCount = height > 96 ? 2 : 1;
    for (let cone = 0; cone < coneCount; cone += 1) {
      const centerX = x + width / 2;
      const centerY = y + 20 + (cone + .5) * (height - 42) / coneCount;
      const radius = Math.min(width * .31, (height - 34) / coneCount * .34) * (1 + pulse * .055);
      const coneGradient = ctx.createRadialGradient(centerX - radius * .24, centerY - radius * .24, 3, centerX, centerY, radius);
      coneGradient.addColorStop(0, pulse > .34 ? accent : '#53566b');
      coneGradient.addColorStop(.34, '#25273a');
      coneGradient.addColorStop(.76, '#0b0d18');
      coneGradient.addColorStop(1, '#484b60');
      ctx.shadowColor = accent;
      ctx.shadowBlur = launch ? 8 + pulse * 19 : 3 + pulse * 8;
      ctx.fillStyle = coneGradient;
      ctx.strokeStyle = pulse > .28 ? accent : '#777b8c';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#11131f';
      ctx.beginPath(); ctx.arc(centerX, centerY, radius * .28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pulse > .42 ? '#fff5be' : accent;
      ctx.globalAlpha = .48 + pulse * .42;
      ctx.beginPath(); ctx.arc(centerX - radius * .28, centerY - radius * .28, radius * .1, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.shadowBlur = 0;
    for (const bolt of [[9, 9], [width - 9, 9], [9, height - 10], [width - 9, height - 10]]) {
      ctx.fillStyle = '#d0b36b';
      ctx.beginPath(); ctx.arc(x + bolt[0], y + bolt[1], 2.2, 0, Math.PI * 2); ctx.fill();
    }
    roundedRect(x + 14, y + height - 13, width - 28, 7, 3, '#242637', accent, 1.5);
    ctx.fillStyle = pulse > .32 ? '#fff170' : '#5e5c6c';
    for (let meter = 0; meter < 5; meter += 1) ctx.fillRect(x + 19 + meter * 10, y + height - 11, 6, 3);
    ctx.fillStyle = '#0a0b12';
    ctx.fillRect(x + 9, y + height, 13, 6);
    ctx.fillRect(x + width - 22, y + height, 13, 6);
    ctx.restore();
  }

  function drawPhase2PlatformFacade(platform, time) {
    if (!platform.phase2Style) return;
    const x = platform.x - game.cameraX;
    const station = world23Phase2Station(platform.phase2StationId);
    const accent = station?.accent || '#50e7ff';
    const beatPhase = station?.beatPhase ?? ((game.levelTime / BASS_STACK_BEAT_SECONDS) % 1);
    const pulse = platform.bassPad
      ? 1 - smoothStep(clamp(beatPhase / .32, 0, 1))
      : .14 + Math.sin(time * .004 + platform.x) * .03;
    ctx.save();
    const style = platform.phase2Style;
    if (style.startsWith('marquee')) {
      const active = station?.completed || (station?.progress || 0) > .62;
      const deckFill = ctx.createLinearGradient(0, platform.y, 0, platform.y + 28);
      deckFill.addColorStop(0, '#6c7488');
      deckFill.addColorStop(.25, '#2b2c42');
      deckFill.addColorStop(1, '#111423');
      const drawGratedDeck = (edge = accent, depth = 12) => {
        roundedRect(x, platform.y, platform.w, depth, 4, deckFill, '#0c0f1b', 4);
        ctx.strokeStyle = edge;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x + 5, platform.y + 2); ctx.lineTo(x + platform.w - 5, platform.y + 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(193,202,215,.38)';
        ctx.lineWidth = 1.4;
        for (let grate = x + 11; grate < x + platform.w - 10; grate += 17) {
          ctx.beginPath(); ctx.moveTo(grate, platform.y + 6); ctx.lineTo(grate + 7, platform.y + depth - 5); ctx.stroke();
        }
      };
      const drawSafetyRail = (left = 8, right = platform.w - 8, height = 22) => {
        ctx.strokeStyle = '#7a8296';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + left, platform.y); ctx.lineTo(x + left, platform.y - height);
        ctx.lineTo(x + right, platform.y - height); ctx.lineTo(x + right, platform.y);
        ctx.stroke();
      };

      if (style === 'marquee-check-in-awning') {
        // The premium booth is a single grounded backplate asset. Keeping this
        // collision-only surface prevents the old flat box facade from being
        // layered back over the finished building.
      } else if (style === 'marquee-west-tower-ledge') {
        drawGratedDeck('#ff4fac', 13);
        ctx.strokeStyle = '#32364b'; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + 18, platform.y + 13); ctx.lineTo(x + 50, platform.y + 45);
        ctx.moveTo(x + platform.w - 18, platform.y + 13); ctx.lineTo(x + platform.w - 50, platform.y + 45);
        ctx.stroke();
        ctx.fillStyle = '#fff1bd'; ctx.font = '900 7px Arial'; ctx.textAlign = 'center';
        ctx.fillText('LIFT ACCESS', x + platform.w / 2, platform.y + 30);
      } else if (style === 'marquee-service-lift') {
        drawGratedDeck('#ffd65a', 23);
        ctx.strokeStyle = '#778096'; ctx.lineWidth = 4;
        ctx.strokeRect(x + 7, platform.y - 46, platform.w - 14, 69);
        ctx.strokeStyle = '#50e7ff'; ctx.lineWidth = 2;
        for (let rail = x + 22; rail < x + platform.w - 12; rail += 28) {
          ctx.beginPath(); ctx.moveTo(rail, platform.y - 41); ctx.lineTo(rail, platform.y + 18); ctx.stroke();
        }
        roundedRect(x + 28, platform.y - 31, platform.w - 56, 19, 4, '#1e2034', '#ff4fac', 2);
        ctx.fillStyle = '#fff1bd'; ctx.font = '900 7px Arial'; ctx.textAlign = 'center';
        ctx.fillText('SERVICE LIFT', x + platform.w / 2, platform.y - 18);
        const direction = Math.cos(game.levelTime * platform.speed + platform.phase) < 0 ? '▲' : '▼';
        ctx.fillStyle = '#50e7ff'; ctx.font = '900 12px Arial';
        ctx.fillText(direction, x + platform.w - 19, platform.y - 17);
      } else if (style === 'marquee-maintenance-catwalk') {
        drawSafetyRail(7, platform.w - 7, 22);
        drawGratedDeck('#b780ff', 13);
        ctx.strokeStyle = 'rgba(255,79,172,.72)'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 16, platform.y + 13); ctx.lineTo(x + 48, platform.y + 32);
        ctx.moveTo(x + platform.w - 16, platform.y + 13); ctx.lineTo(x + platform.w - 48, platform.y + 32);
        ctx.stroke();
      } else if (style === 'marquee-east-sign-ledge') {
        roundedRect(x - 108, platform.y + 4, 108, 9, 3, '#24283a', '#ffd65a', 2);
        drawGratedDeck('#ffd65a', 13);
        ctx.strokeStyle = '#32364b'; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + 16, platform.y + 13); ctx.lineTo(x - 95, platform.y + 46);
        ctx.moveTo(x + platform.w - 16, platform.y + 13); ctx.lineTo(x + platform.w - 48, platform.y + 45);
        ctx.stroke();
        ctx.fillStyle = active ? '#ff4fac' : '#5f526c';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = active ? 9 : 0;
        ctx.beginPath(); ctx.arc(x + platform.w / 2, platform.y + 25, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      } else if (style === 'marquee-east-tower-crossbeam') {
        roundedRect(x - 58, platform.y + 4, 58, 9, 3, '#24283a', '#50e7ff', 2);
        drawSafetyRail(10, platform.w - 10, 21);
        drawGratedDeck('#50e7ff', 13);
        ctx.strokeStyle = 'rgba(255,214,90,.78)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 22, platform.y + 13); ctx.lineTo(x + 48, platform.y + 34);
        ctx.moveTo(x + platform.w - 22, platform.y + 13); ctx.lineTo(x + platform.w - 48, platform.y + 34); ctx.stroke();
      } else if (style === 'marquee-activation-perch') {
        drawSafetyRail(10, 194, 21);
        drawGratedDeck('#ffd65a', 14);
        roundedRect(x + 205, platform.y + 15, 96, 37, 6, '#191a2d', '#50e7ff', 2.5);
        for (let meter = 0; meter < 5; meter += 1) {
          const lit = station?.completed || meter / 5 < (station?.progress || 0);
          ctx.fillStyle = lit ? ['#50e7ff', '#ff4fac', '#ffd65a'][meter % 3] : '#454052';
          ctx.fillRect(x + 216 + meter * 14, platform.y + 25, 8, 13 - meter % 2 * 4);
        }
        ctx.fillStyle = '#fff1bd'; ctx.font = '900 8px Arial'; ctx.textAlign = 'left';
        ctx.fillText('POWER', x + 218, platform.y + 47);
      }
    } else if (style.startsWith('roadie-')) {
      const metal = ctx.createLinearGradient(0, platform.y, 0, platform.y + 34);
      metal.addColorStop(0, '#777d8e');
      metal.addColorStop(.22, '#313344');
      metal.addColorStop(1, '#11131f');
      const drawGratedSurface = (edge = accent, depth = 18) => {
        roundedRect(x, platform.y, platform.w, depth, 4, metal, '#090a12', 3);
        ctx.strokeStyle = edge; ctx.lineWidth = 2.3;
        ctx.beginPath(); ctx.moveTo(x + 5, platform.y + 2); ctx.lineTo(x + platform.w - 5, platform.y + 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(218,225,232,.32)'; ctx.lineWidth = 1.2;
        for (let grate = x + 12; grate < x + platform.w - 9; grate += 18) {
          ctx.beginPath(); ctx.moveTo(grate, platform.y + 6); ctx.lineTo(grate + 7, platform.y + depth - 4); ctx.stroke();
        }
      };
      const drawRail = (left, right, railHeight = 24) => {
        ctx.strokeStyle = '#73798a'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + left, platform.y); ctx.lineTo(x + left, platform.y - railHeight);
        ctx.lineTo(x + right, platform.y - railHeight); ctx.lineTo(x + right, platform.y);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(80,231,255,.62)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x + left, platform.y - railHeight + 6); ctx.lineTo(x + right, platform.y - railHeight + 6); ctx.stroke();
      };

      if (style === 'roadie-loading-awning') {
        if (!images.roadieLoadingAnnex) {
          const awning = ctx.createLinearGradient(0, platform.y, 0, platform.y + 42);
          awning.addColorStop(0, '#f3c36f'); awning.addColorStop(.24, '#c95b62'); awning.addColorStop(1, '#5e334e');
          roundedRect(x, platform.y, platform.w, 34, 5, awning, '#321c37', 3);
          for (let stripe = 0; stripe < 9; stripe += 1) {
            ctx.fillStyle = stripe % 2 ? 'rgba(80,231,255,.22)' : 'rgba(255,214,90,.25)';
            ctx.fillRect(x + 12 + stripe * (platform.w - 24) / 9, platform.y + 5, (platform.w - 24) / 18, 24);
          }
          ctx.fillStyle = '#ff4fac';
          for (let scallop = x + 15; scallop < x + platform.w - 5; scallop += 32) {
            ctx.beginPath(); ctx.arc(scallop, platform.y + 34, 10, 0, Math.PI); ctx.fill();
          }
          ctx.strokeStyle = '#353443'; ctx.lineWidth = 6;
          for (const braceX of [x + 34, x + platform.w - 34]) {
            ctx.beginPath(); ctx.moveTo(braceX, platform.y + 34); ctx.lineTo(braceX + (braceX < x + platform.w / 2 ? 25 : -25), platform.y + 76); ctx.stroke();
          }
        }
      } else if (style === 'roadie-road-case-stack') {
        const caseWidths = [platform.w - 18, platform.w * .55, platform.w * .38];
        let caseX = x + 9;
        let caseY = platform.y;
        caseWidths.forEach((caseWidth, index) => {
          const caseHeight = index ? 31 : 38;
          roundedRect(caseX, caseY, caseWidth, caseHeight, 5, '#1a1c29', '#a9afba', 3);
          ctx.strokeStyle = index === 1 ? '#50e7ff' : index === 2 ? '#ffd65a' : '#ff4fac';
          ctx.lineWidth = 2; ctx.strokeRect(caseX + 9, caseY + 8, caseWidth - 18, caseHeight - 16);
          ctx.fillStyle = '#d7b86b';
          for (const cornerX of [caseX + 6, caseX + caseWidth - 6]) {
            ctx.fillRect(cornerX - 3, caseY + 3, 6, 6); ctx.fillRect(cornerX - 3, caseY + caseHeight - 9, 6, 6);
          }
          caseY += caseHeight - 2;
          caseX += index === 0 ? 18 : 23;
        });
      } else if (style === 'roadie-maintenance-balcony') {
        drawRail(8, platform.w - 8, 25);
        drawGratedSurface('#50e7ff', 18);
        ctx.strokeStyle = '#3a3b4c'; ctx.lineWidth = 7;
        for (const braceX of [x + 24, x + platform.w - 24]) {
          ctx.beginPath(); ctx.moveTo(braceX, platform.y + 18); ctx.lineTo(braceX + (braceX < x + platform.w / 2 ? 38 : -38), platform.y + 62); ctx.stroke();
        }
      } else if (style === 'roadie-freight-lift') {
        if (images.roadieFreightCage) {
          ctx.drawImage(images.roadieFreightCage, x - 10, platform.y - 122, platform.w + 20, 147);
        } else {
          const cageMetal = ctx.createLinearGradient(0, platform.y - 92, 0, platform.y + 24);
          cageMetal.addColorStop(0, '#6f7688'); cageMetal.addColorStop(.3, '#2b2e3a'); cageMetal.addColorStop(1, '#11131d');
          roundedRect(x + 4, platform.y - 92, platform.w - 8, 116, 5, cageMetal, '#090a10', 4);
          ctx.strokeStyle = '#d5a63e'; ctx.lineWidth = 4;
          ctx.strokeRect(x + 16, platform.y - 63, platform.w - 32, 77);
          ctx.strokeStyle = 'rgba(80,231,255,.58)'; ctx.lineWidth = 1.5;
          for (let meshX = x + 24; meshX < x + platform.w - 18; meshX += 18) {
            ctx.beginPath(); ctx.moveTo(meshX, platform.y - 61); ctx.lineTo(meshX + 26, platform.y + 12); ctx.stroke();
          }
          drawGratedSurface('#ffd65a', 25);
          roundedRect(x + 27, platform.y - 88, platform.w - 54, 21, 4, '#1a1b2a', '#ff4fac', 2);
        }
        ctx.fillStyle = '#fff0bd'; ctx.font = '900 7px Arial'; ctx.textAlign = 'center';
        ctx.fillText('ROADIE FREIGHT', x + platform.w / 2, platform.y - 87);
      } else if (style === 'roadie-crawler-service-deck') {
        roundedRect(x, platform.y, platform.w, 17, 4, '#343846', game.cableCrawler.utilityPowered ? '#a4f766' : '#b780ff', 3);
        ctx.strokeStyle = '#747b89'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 9, platform.y); ctx.lineTo(x + 9, platform.y - 20); ctx.lineTo(x + 72, platform.y - 20);
        ctx.moveTo(x + platform.w - 9, platform.y); ctx.lineTo(x + platform.w - 9, platform.y - 20); ctx.lineTo(x + platform.w - 72, platform.y - 20);
        ctx.stroke();
        ctx.strokeStyle = '#2d303d'; ctx.lineWidth = 6;
        for (const braceX of [x + 38, x + platform.w - 38]) {
          ctx.beginPath(); ctx.moveTo(braceX, platform.y + 16); ctx.lineTo(braceX + (braceX < x + platform.w / 2 ? 34 : -34), platform.y + 48); ctx.stroke();
        }
        for (const lampX of [x + 22, x + platform.w - 22]) {
          ctx.fillStyle = game.cableCrawler.utilityPowered ? '#a4f766' : '#ff835c';
          ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 7;
          ctx.beginPath(); ctx.arc(lampX, platform.y + 7, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else if (style === 'roadie-vent-housing') {
        roundedRect(x, platform.y, platform.w, 14, 4, '#343846', game.cableCrawler.utilityPowered ? '#a4f766' : '#50e7ff', 3);
        ctx.strokeStyle = '#727987'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 7, platform.y); ctx.lineTo(x + 7, platform.y - 18); ctx.lineTo(x + 62, platform.y - 18);
        ctx.moveTo(x + platform.w - 7, platform.y); ctx.lineTo(x + platform.w - 7, platform.y - 18); ctx.lineTo(x + platform.w - 62, platform.y - 18);
        ctx.stroke();
        ctx.fillStyle = game.cableCrawler.utilityPowered ? '#a4f766' : '#ff4fac';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(x + platform.w - 20, platform.y + 7, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      } else if (style === 'roadie-bass-launch') {
        drawRoadieSpeakerCabinet(x + 8, platform.y + 5, platform.w - 24, 92, pulse, '#a4f766', { launch: true });
        ctx.strokeStyle = '#5b5f72'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(x + 28, platform.y + 97); ctx.lineTo(x + 12, platform.y + 116);
        ctx.moveTo(x + platform.w - 32, platform.y + 97); ctx.lineTo(x + platform.w - 16, platform.y + 116); ctx.stroke();
      } else if (style === 'roadie-truss-bridge') {
        drawPhase2Truss(x, platform.y + 3, platform.w, 48, '#ff4fac');
        roundedRect(x, platform.y, platform.w, 11, 3, '#36394a', '#fff0bd', 2);
      } else if (style === 'roadie-upper-access-ledge') {
        drawRail(8, platform.w - 8, 20);
        drawGratedSurface('#ffd65a', 18);
        ctx.strokeStyle = '#36394a'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(x + 18, platform.y + 18); ctx.lineTo(x - 35, platform.y + 54);
        ctx.moveTo(x + platform.w - 18, platform.y + 18); ctx.lineTo(x + platform.w + 23, platform.y + 54); ctx.stroke();
      } else if (style === 'roadie-rehearsal-roof') {
        drawRail(10, 102, 22);
        drawRail(platform.w - 102, platform.w - 10, 22);
        drawGratedSurface(station?.completed ? '#a4f766' : '#50e7ff', 23);
        const rackX = x + platform.w / 2 - 116;
        roundedRect(rackX, platform.y + 23, 232, 56, 7, '#131521', '#73798d', 3);
        for (let meter = 0; meter < 12; meter += 1) {
          const activeMeters = station?.completed ? 12 : Math.max(2, Math.floor((station?.progress || 0) * 12));
          ctx.fillStyle = meter < activeMeters
            ? (meter > 9 ? '#ff4fac' : meter > 5 ? '#ffd65a' : '#a4f766') : '#343647';
          ctx.fillRect(rackX + 17 + meter * 17, platform.y + 38, 10, 22 - meter % 3 * 4);
        }
        ctx.fillStyle = '#f2d27c'; ctx.font = '900 8px Arial'; ctx.textAlign = 'center';
        ctx.fillText(station?.completed ? 'MASTER RACK • LOCKED' : 'MASTER RACK • STANDBY', x + platform.w / 2, platform.y + 70);
      }
    } else if (style.startsWith('lagoon')) {
      const floating = style.includes('pontoon') || style.includes('rope-deck');
      const deck = ctx.createLinearGradient(0, platform.y + 5, 0, platform.y + 52);
      deck.addColorStop(0, '#f0b96b'); deck.addColorStop(1, '#5c4369');
      roundedRect(x + 5, platform.y + 7, platform.w - 10, 42, 7, deck, '#50e7ff', 2.5);
      ctx.strokeStyle = 'rgba(255,244,196,.58)'; ctx.lineWidth = 2;
      for (let plank = x + 22; plank < x + platform.w - 12; plank += 32) {
        ctx.beginPath(); ctx.moveTo(plank, platform.y + 10); ctx.lineTo(plank, platform.y + 44); ctx.stroke();
      }
      if (style.includes('truss')) drawPhase2Truss(x + 8, platform.y + 15, platform.w - 16, 46, '#ff4fac');
      if (floating) {
        ctx.fillStyle = '#ff7d79'; ctx.strokeStyle = '#fff0c6'; ctx.lineWidth = 2;
        for (let floatX = x + 28; floatX < x + platform.w - 12; floatX += 56) {
          ctx.beginPath(); ctx.ellipse(floatX, platform.y + 58, 22, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.strokeStyle = '#ffe0a0'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 8, platform.y + 8); ctx.quadraticCurveTo(x + platform.w / 2, platform.y + 78, x + platform.w - 8, platform.y + 8); ctx.stroke();
      }
    } else if (style.startsWith('golden')) {
      if (style.includes('ticket-ring')) {
        ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 8; ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.ellipse(x + platform.w / 2, platform.y + 38, platform.w * .32, 48, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (style.includes('neon-arrow')) {
        ctx.fillStyle = '#fff170'; ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(x + 22, platform.y + 18); ctx.lineTo(x + platform.w - 56, platform.y + 18);
        ctx.lineTo(x + platform.w - 56, platform.y + 5); ctx.lineTo(x + platform.w - 16, platform.y + 38);
        ctx.lineTo(x + platform.w - 56, platform.y + 71); ctx.lineTo(x + platform.w - 56, platform.y + 58);
        ctx.lineTo(x + 22, platform.y + 58); ctx.closePath(); ctx.fill();
      } else if (style.includes('road-case')) {
        roundedRect(x + 7, platform.y + 8, platform.w - 14, 58, 7, '#392943', '#ffd65a', 3);
        ctx.fillStyle = '#fff1ae'; ctx.font = '900 9px Arial'; ctx.textAlign = 'center';
        ctx.fillText('TOUR ADMISSION', x + platform.w / 2, platform.y + 41);
      } else {
        const gold = ctx.createLinearGradient(0, platform.y + 5, 0, platform.y + 56);
        gold.addColorStop(0, '#ffe781'); gold.addColorStop(1, '#b56943');
        roundedRect(x + 5, platform.y + 7, platform.w - 10, 46, 7, gold, '#fff4ca', 3);
        for (let ticket = x + 26; ticket < x + platform.w - 12; ticket += 48) {
          ctx.fillStyle = '#ff4fac';
          roundedRect(ticket - 14, platform.y + 18, 28, 19, 4, '#ff4fac', '#fff6cd', 1.5);
        }
      }
    } else if (style === 'encore-stash') {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 4;
      ctx.fillStyle = '#34234e';
      ctx.beginPath(); ctx.roundRect(x + 4, platform.y + 8, platform.w - 8, 68, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.38)';
      for (let brace = x + 24; brace < x + platform.w - 12; brace += 68) {
        ctx.beginPath(); ctx.moveTo(brace, platform.y + 10); ctx.lineTo(brace + 28, platform.y + 68); ctx.stroke();
      }
      ctx.fillStyle = '#fff170'; ctx.font = '900 10px Arial'; ctx.textAlign = 'center';
      ctx.fillText(station?.completed ? 'ENCORE CACHE OPEN' : 'NN TOUR • CASE 23', x + platform.w / 2, platform.y + 45);
    }
    ctx.restore();
  }

  function drawPlatform(platform, time) {
    const x = platform.x - game.cameraX;
    if (x + platform.w < -100 || x > canvas.width + 100) return;
    if (platform.phase2StationId === 'marquee' || platform.phase2StationId === 'rooftops') {
      drawPhase2PlatformFacade(platform, time);
      return;
    }
    if (drawRemasteredPlatform(platform, time)) {
      drawPhase2PlatformFacade(platform, time);
      return;
    }
    const section = currentSection(platform.x);
    const palette = {
      soundcheck: ['#6b9d62', '#315b50'], beach: ['#f2cf77', '#a75d58'],
      rooftops: ['#b06a54', '#512d55'], stampede: ['#64547f', '#29224d'],
      lagoon: ['#36aeb7', '#15506d'], powerup: ['#5a3d78', '#241a4f'],
      victory: ['#bd7899', '#3a235d'],
    }[section.id] || ['#8c6a83', '#39274f'];
    const top = platform.style?.includes('upper') || platform.style?.includes('bridge') ? 8 : 14;
    roundedRect(x, platform.y, platform.w, platform.h, platform.ground ? 0 : 11, palette[1], 'rgba(255,255,255,.18)', 2);
    const surface = ctx.createLinearGradient(0, platform.y, 0, platform.y + top);
    surface.addColorStop(0, '#fff1a4');
    surface.addColorStop(1, palette[0]);
    roundedRect(x, platform.y, platform.w, top, platform.ground ? 0 : 10, surface);
    if (platform.ground) {
      ctx.fillStyle = 'rgba(26,15,50,.25)';
      for (let detail = x + 35; detail < x + platform.w; detail += 90) {
        ctx.beginPath();
        ctx.arc(detail, platform.y + 44 + Math.sin(detail) * 5, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.shadowColor = section.accent;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = section.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 12, platform.y + 4);
      ctx.lineTo(x + platform.w - 12, platform.y + 4);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    if (images.heroTerrainItems) {
      const atlas = terrainSpriteFrames[section.id] || terrainSpriteFrames.soundcheck;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, platform.y - (platform.ground ? 2 : 8), platform.w, Math.min(platform.h + 10, platform.ground ? 96 : 50), platform.ground ? 0 : 10);
      ctx.clip();
      const tileWidth = platform.ground ? 185 : 150;
      for (let offset = 0; offset < platform.w + tileWidth; offset += tileWidth) {
        ctx.drawImage(images.heroTerrainItems, ...atlas, x + offset, platform.y - (platform.ground ? 3 : 10), tileWidth, platform.ground ? 102 : 62);
      }
      ctx.restore();
    }
    drawPhase2PlatformFacade(platform, time);
  }

  function drawTaco(item, time, camera = game.cameraX) {
    if (item.collected) return;
    const x = item.x - camera;
    if (x < -50 || x > canvas.width + 50) return;
    const y = item.y + Math.sin(time * .006 + item.bob) * 4;
    ctx.save();
    ctx.translate(x + item.w / 2, y + item.h / 2);
    ctx.rotate((item.rotation || 0) + Math.sin(time * .003 + item.bob) * .08);
    if (images.items) {
      ctx.shadowColor = item.type === 'rainbow'
        ? `hsl(${(time * .12 + item.x) % 360} 95% 65%)`
        : item.type === 'golden' ? '#fff170' : '#ffcf65';
      ctx.shadowBlur = item.type === 'rainbow' ? 20 : item.type === 'golden' ? 16 : 6;
      if (item.type === 'golden') ctx.filter = 'sepia(1) saturate(2.4) brightness(1.3)';
      else if (item.type === 'rainbow') {
        ctx.filter = `hue-rotate(${(time * .12 + item.x) % 360}deg) saturate(2.5) brightness(1.25)`;
      }
      ctx.drawImage(images.items, 0, 0, 16, 16, -item.w / 2, -item.h / 2, item.w, item.h);
      ctx.filter = 'none';
      ctx.restore();
      return;
    }
    if (item.type === 'golden') {
      ctx.shadowColor = '#fff170';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ffd338';
    } else if (item.type === 'rainbow') {
      ctx.shadowColor = `hsl(${(time * .12 + item.x) % 360} 95% 65%)`;
      ctx.shadowBlur = 22;
      ctx.fillStyle = `hsl(${(time * .12 + item.x) % 360} 88% 64%)`;
    } else {
      ctx.shadowColor = '#ffcf65';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#f7c55c';
    }
    ctx.beginPath();
    ctx.arc(0, 2, item.w * .48, Math.PI, 0);
    ctx.lineTo(item.w * .48, 8);
    ctx.quadraticCurveTo(0, 16, -item.w * .48, 8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#63cc65';
    ctx.fillRect(-item.w * .3, 1, item.w * .6, 4);
    ctx.fillStyle = '#ef5a56';
    ctx.fillRect(-item.w * .2, 5, item.w * .4, 3);
    ctx.restore();
  }

  function drawEnemy(enemy, time) {
    const x = enemy.x - game.cameraX;
    if (x < -90 || x > canvas.width + 90) return;
    const groundBaseline = (enemy.baseY ?? enemy.y) + enemy.h;
    ctx.save();
    ctx.globalAlpha = enemy.alive ? .27 : .14;
    ctx.fillStyle = '#18112e';
    ctx.beginPath();
    ctx.ellipse(x + enemy.w / 2, groundBaseline + 2, 24, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (images.worldEnemies) {
      const typeIndex = { berry: 0, mango: 1, spaghetti: 2, pepper: 3, pineapple: 4 }[enemy.type] || 0;
      const frame = !enemy.alive ? 3 : enemy.charging || enemy.rolling ? 2 : enemy.telegraph ? 1 : 0;
      const sourceX = [30, 315, 605, 905][frame];
      const sourceY = [385, 495, 600, 700, 805][typeIndex];
      const sourceH = typeIndex === 4 ? 132 : 120;
      ctx.save();
      ctx.translate(x + enemy.w / 2, enemy.y + enemy.h);
      ctx.scale(enemy.dir, 1);
      ctx.globalAlpha = !enemy.alive ? Math.max(.2, 1 - enemy.splat * 2) : 1;
      ctx.drawImage(images.worldEnemies, sourceX, sourceY, 275, sourceH, -46, -74, 92, 78);
      ctx.restore();
      if (enemy.alive) heroCore.drawEnemyBehaviorSignals(ctx, enemy, x, { warningColor: '#ffd65a', chargeColor: '#ff4fac', rollColor: '#50e7ff' });
      return;
    }
    if (!enemy.alive) {
      const scaleY = Math.max(.08, 1 - enemy.splat * 5);
      ctx.save();
      ctx.translate(x + enemy.w / 2, enemy.y + enemy.h);
      ctx.scale(1 + enemy.splat * 2, scaleY);
      roundedRect(-enemy.w / 2, -enemy.h, enemy.w, enemy.h, 16, '#ffb05d');
      ctx.restore();
      return;
    }
    const colors = {
      berry: ['#8248bd', '#d864df'], mango: ['#ffb442', '#ff7c43'], spaghetti: ['#f4d36f', '#d86947'],
      pepper: ['#ff5369', '#aa294b'], pineapple: ['#f6c84d', '#6cc966'],
    }[enemy.type];
    const bob = Math.sin(time * .009 + enemy.x) * 2;
    ctx.save();
    ctx.translate(x + enemy.w / 2, enemy.y + enemy.h / 2 + bob);
    ctx.scale(enemy.dir, 1);
    if (enemy.rolling) ctx.rotate(enemy.rollAngle || 0);
    ctx.shadowColor = enemy.telegraph ? '#ffd65a' : colors[1];
    ctx.shadowBlur = enemy.telegraph ? 18 : 7;
    roundedRect(-23, -25, 46, 50, enemy.type === 'spaghetti' ? 10 : 20, colors[0], colors[1], 3);
    if (enemy.type === 'berry') {
      ctx.fillStyle = '#5b2c8a';
      for (let i = 0; i < 5; i += 1) ctx.fillRect(-20 + i * 9, -19, 5, 5);
    } else if (enemy.type === 'mango') {
      ctx.fillStyle = '#65bd5d';
      ctx.beginPath(); ctx.ellipse(8, -29, 9, 4, -.5, 0, Math.PI * 2); ctx.fill();
    } else if (enemy.type === 'spaghetti') {
      ctx.strokeStyle = '#fff0a0'; ctx.lineWidth = 4;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath(); ctx.moveTo(i * 7, -20); ctx.quadraticCurveTo(i * 9 + 8, 0, i * 7, 20); ctx.stroke();
      }
    } else if (enemy.type === 'pepper') {
      ctx.fillStyle = '#53b965'; ctx.fillRect(-4, -31, 8, 10);
    } else {
      ctx.strokeStyle = '#8a9b3f'; ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i += 1) { ctx.beginPath(); ctx.moveTo(i * 11, -20); ctx.lineTo(i * 11 + 8, 20); ctx.stroke(); }
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-9, -5, 7, 0, Math.PI * 2); ctx.arc(9, -5, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#25123e';
    ctx.beginPath(); ctx.arc(-7, -4, 3, 0, Math.PI * 2); ctx.arc(11, -4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#25123e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 10, 10, .1, Math.PI - .1); ctx.stroke();
    ctx.restore();
    heroCore.drawEnemyBehaviorSignals(ctx, enemy, x, { warningColor: '#ffd65a', chargeColor: '#ff4fac', rollColor: '#50e7ff' });
  }

  function drawGroundedCheckpointOlivia(centerX, bottomY, time, look = 0) {
    if (!images.bandOliviaCrowd) return false;
    const bounds = images.checkpointOliviaBounds || { x: 1300, y: 339, w: 157, h: 243 };
    const height = 112;
    const width = height * (bounds.w / bounds.h);
    const numericLook = Number.isFinite(Number(look)) ? Number(look) : 0;
    const sway = Math.sin(time * .004 + numericLook) * .012;
    ctx.save();
    ctx.translate(centerX, bottomY);
    ctx.rotate(sway);
    ctx.shadowColor = '#50e7ff';
    ctx.shadowBlur = 6;
    ctx.drawImage(
      images.bandOliviaCrowd,
      bounds.x, bounds.y, bounds.w, bounds.h,
      -width / 2, -height, width, height,
    );
    ctx.restore();
    return true;
  }

  function drawRemasteredCheckpointStation(checkpoint, time) {
    if (!images.checkpointStations) return false;
    const screenX = checkpoint.x - game.cameraX;
    if (screenX < -280 || screenX > canvas.width + 280) return true;
    const pulse = (Math.sin(time * .007 + checkpoint.x) + 1) * .5;
    const frameColumns = 3;
    const frameRows = 2;
    const frame = clamp(Math.round(checkpoint.look), 0, 5);
    const cellWidth = images.checkpointStations.width / frameColumns;
    const cellHeight = images.checkpointStations.height / frameRows;
    const bounds = images.checkpointBounds?.[frame] || {
      x: frame % frameColumns * cellWidth,
      y: Math.floor(frame / frameColumns) * cellHeight,
      w: cellWidth,
      h: cellHeight,
    };
    const drawHeight = 180;
    const drawWidth = Math.min(280, drawHeight * (bounds.w / bounds.h));
    const centerX = screenX + checkpoint.w / 2;
    const baseY = GROUND_Y + 2;

    ctx.save();
    ctx.globalAlpha = .25;
    ctx.fillStyle = '#100b2d';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY + 1, 125, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Heavy checkpoint structures receive a visible deck and foundation. The
    // cropped art and Olivia are then bottom-anchored to this shared contact
    // line so transparent padding can never make the station hover.
    ctx.save();
    roundedRect(centerX - drawWidth * .46, baseY - 18, drawWidth * .92, 18, 5, '#30224c', checkpoint.accent, 2);
    ctx.fillStyle = '#1d1735';
    ctx.fillRect(centerX - drawWidth * .36, baseY - 5, 18, 9);
    ctx.fillRect(centerX + drawWidth * .36 - 18, baseY - 5, 18, 9);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = checkpoint.accent;
    ctx.shadowBlur = checkpoint.activated ? 24 + pulse * 8 : 8;
    ctx.drawImage(
      images.checkpointStations,
      bounds.x, bounds.y, bounds.w, bounds.h,
      centerX - drawWidth / 2, baseY - drawHeight, drawWidth, drawHeight,
    );
    ctx.restore();

    // Olivia remains a separate, independently grounded character so the
    // station can glow without making her float or pulse with the machinery.
    ctx.save();
    ctx.globalAlpha = checkpoint.activated ? 1 : .96;
    ctx.shadowColor = checkpoint.accent;
    ctx.shadowBlur = checkpoint.activated ? 16 : 6;
    drawGroundedCheckpointOlivia(centerX + 73, baseY - 1, time, checkpoint.look);
    ctx.restore();

    const panelY = baseY - drawHeight - 42;
    ctx.save();
    roundedRect(centerX - 110, panelY, 220, 38, 13, 'rgba(19,10,48,.92)', checkpoint.accent, 3);
    ctx.fillStyle = '#fff7d7';
    ctx.font = '900 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${checkpoint.activated ? '✓ ' : ''}${checkpoint.name.toUpperCase()}`, centerX, panelY + 16, 204);
    ctx.fillStyle = checkpoint.accent;
    ctx.font = '900 8px Arial';
    ctx.fillText(checkpoint.activated ? 'STATION LIT • OLIVIA RADIO LIVE' : 'APPROACH TO ACTIVATE', centerX, panelY + 29, 204);
    ctx.restore();
    return true;
  }

  function drawCheckpoint(checkpoint, time) {
    if (drawRemasteredCheckpointStation(checkpoint, time)) return;
    const x = checkpoint.x - game.cameraX;
    if (x < -260 || x > canvas.width + 260) return;
    const pulse = 1 + Math.sin(time * .006 + checkpoint.x) * .018;
    ctx.save();
    ctx.translate(x + 90, GROUND_Y);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = .32;
    ctx.fillStyle = '#17102c';
    ctx.beginPath();
    ctx.ellipse(0, -2, 112, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    roundedRect(-108, -12, 216, 12, 6, '#281c4c', checkpoint.accent, 2);
    if (images.environmentStage) {
      ctx.drawImage(images.environmentStage, 1184, 542, 429, 126, -112, -144, 224, 66);
      ctx.drawImage(images.environmentStage, 1245, 384, 306, 124, -104, -58, 208, 58);
    }
    ctx.shadowColor = checkpoint.accent;
    ctx.shadowBlur = checkpoint.activated ? 24 : 10;
    roundedRect(-75, -118, 150, 72, 14, 'rgba(31,17,64,.9)', checkpoint.accent, 4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = checkpoint.accent;
    ctx.fillRect(-64, -108, 128, 10);
    ctx.fillStyle = '#fff4cf';
    ctx.font = '900 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(checkpoint.name.toUpperCase(), 0, -80, 136);
    ctx.font = '900 10px Arial';
    ctx.fillStyle = checkpoint.accent;
    ctx.fillText(checkpoint.activated ? '✓ CHECKPOINT LIT' : 'OLIVIA RADIO LIVE', 0, -58);
    ctx.fillStyle = 'rgba(18,11,38,.35)';
    ctx.beginPath();
    ctx.ellipse(-91, -1, 30, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawOlivia(-130, -96, time, checkpoint.look);
    ctx.restore();
  }

  function drawOlivia(x, y, time, look = 0) {
    const numericLook = Number.isFinite(Number(look)) ? Number(look) : 0;
    if (images.bandOliviaCrowd) {
      if (look === 'crowd') {
        ctx.save();
        ctx.translate(x, y + Math.sin(time * .007) * 3);
        ctx.drawImage(images.bandOliviaCrowd, 1044, 394, 263, 132, -68, -30, 150, 76);
        ctx.restore();
        return;
      }
      // Checkpoint Olivia is always the upright taco-host pose. Her color
      // accent still varies by station, but no station can select the bow.
      const sprite = [1300, 339, 157, 243];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(time * .004 + numericLook) * .018);
      ctx.drawImage(images.bandOliviaCrowd, ...sprite, -8, -8, 78, 104);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#7a4d35';
    ctx.beginPath(); ctx.arc(20, 19, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2c099';
    ctx.beginPath(); ctx.arc(20, 21, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff4fac'; ctx.fillRect(7, 5, 14, 7);
    ctx.fillStyle = '#50e7ff'; ctx.fillRect(21, 5, 14, 7);
    ctx.fillStyle = '#282044';
    roundedRect(5, 34, 30, 44, 10, '#282044');
    ctx.fillStyle = ['#ffd65a', '#50e7ff', '#ff4fac', '#a4f766', '#b780ff'][look % 5];
    ctx.fillRect(11, 40, 18, 27);
    ctx.fillStyle = '#f2c099';
    ctx.beginPath(); ctx.arc(12, 82, 6, 0, Math.PI * 2); ctx.arc(29, 82, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPhase2SpeechBubble(worldX, worldY, text, accent) {
    const screenX = worldX - game.cameraX;
    if (screenX < -260 || screenX > canvas.width + 260) return;
    ctx.save();
    ctx.font = '900 11px Arial';
    ctx.textAlign = 'center';
    const width = clamp(ctx.measureText(text).width + 34, 132, 250);
    const left = clamp(screenX - width / 2, 12, canvas.width - width - 12);
    roundedRect(left, worldY, width, 40, 14, 'rgba(22,10,52,.94)', accent, 3);
    ctx.fillStyle = 'rgba(22,10,52,.94)';
    ctx.beginPath();
    const tailX = clamp(screenX, left + 26, left + width - 26);
    ctx.moveTo(tailX - 8, worldY + 38);
    ctx.lineTo(tailX + 6, worldY + 38);
    ctx.lineTo(tailX - 1, worldY + 50);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8dc';
    ctx.fillText(text, left + width / 2, worldY + 25, width - 22);
    ctx.restore();
  }

  function drawPreShowBandMember(memberIndex, centerX, bottomY, height, time, options = {}) {
    if (!images.preShowBand) return false;
    const member = band[memberIndex];
    const cellWidth = images.preShowBand.width / band.length;
    const bounds = images.preShowBandBounds?.[memberIndex] || {
      x: memberIndex * cellWidth, y: 0, w: cellWidth, h: images.preShowBand.height,
    };
    const drawWidth = height * (bounds.w / bounds.h);
    const beat = Math.sin(time * (memberIndex === 4 ? .018 : .009) + memberIndex * .7);
    ctx.save();
    ctx.translate(centerX, bottomY);
    if (options.mirror) ctx.scale(-1, 1);
    ctx.rotate(beat * (memberIndex === 4 ? .018 : .008));
    ctx.scale(1 + Math.max(0, beat) * .008, 1 - Math.max(0, beat) * .006);
    ctx.shadowColor = member.color;
    ctx.shadowBlur = options.glow === false ? 0 : 8 + Math.max(0, beat) * 5;
    ctx.drawImage(
      images.preShowBand,
      bounds.x, bounds.y, bounds.w, bounds.h,
      -drawWidth / 2, -height, drawWidth, height,
    );
    ctx.restore();
    return true;
  }

  function drawReplacementBandSprite(memberIndex, phase, centerX, bottomY, width, height) {
    let sheet = null;
    let cellWidth = 0;
    let cellHeight = 0;
    let frame = phase;
    if (memberIndex === 0 && images.nova) {
      sheet = images.nova;
      cellWidth = sheet.width / 2;
      cellHeight = sheet.height;
    } else if ((memberIndex === 2 || memberIndex === 3) && images.bandReplacements) {
      sheet = images.bandReplacements;
      cellWidth = sheet.width / 2;
      cellHeight = sheet.height / 2;
      frame = memberIndex === 2 ? phase : 2 + phase;
    } else {
      return false;
    }
    ctx.drawImage(
      sheet,
      (frame % 2) * cellWidth, Math.floor(frame / 2) * cellHeight, cellWidth, cellHeight,
      centerX - width / 2, bottomY - height, width, height,
    );
    return true;
  }

  function drawBandCameo(cameo, time) {
    const x = cameo.x - game.cameraX;
    if (x < -120 || x > canvas.width + 120) return;
    const member = band[cameo.member];
    const performanceBeat = Math.sin(time * .008 + cameo.member);
    ctx.save();
    ctx.translate(x, GROUND_Y);
    ctx.fillStyle = 'rgba(18,11,38,.32)';
    ctx.beginPath();
    ctx.ellipse(30, 1, 38, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Animate around a fixed foot line. Sway and a tiny anchored squash retain
    // personality without lifting the performer away from the terrain.
    ctx.rotate(performanceBeat * .012);
    ctx.scale(1 + Math.abs(performanceBeat) * .006, 1 - Math.abs(performanceBeat) * .008);
    if (cameo.casual && drawPreShowBandMember(cameo.member, 30, 0, 162, time, { glow: false })) {
      ctx.fillStyle = member.color;
      ctx.font = '900 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${member.name} • HEADING BACKSTAGE`, 30, -170);
      ctx.restore();
      if (cameo.dialogueTimer > 0) {
        drawPhase2SpeechBubble(cameo.x + 30, GROUND_Y - 225, cameo.dialogue, member.color);
      }
      return;
    }
    if (drawReplacementBandSprite(
      cameo.member,
      Math.floor(time * .002 + cameo.member) % 2,
      30,
      0,
      150,
      158,
    )) {
      ctx.fillStyle = member.color;
      ctx.font = '900 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${member.name} • ${member.role}`, 30, -166);
      ctx.restore();
      return;
    }
    if (images.bandOliviaCrowd) {
      const cameos = [
        [13, 15, 176, 288], [368, 12, 197, 288], [717, 9, 162, 296],
        [1032, 28, 140, 276], [1306, 29, 179, 263],
      ];
      ctx.drawImage(images.bandOliviaCrowd, ...cameos[cameo.member], -20, -150, 100, 150);
      ctx.fillStyle = member.color;
      ctx.font = '900 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${member.name} • ${member.role}`, 30, -158);
      ctx.restore();
      return;
    }
    ctx.translate(0, -92);
    ctx.fillStyle = '#f0b88e';
    ctx.beginPath(); ctx.arc(30, 18, 16, 0, Math.PI * 2); ctx.fill();
    roundedRect(10, 32, 40, 56, 10, '#171727', member.color, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(20, 36, 20, 32);
    ctx.fillStyle = member.color;
    ctx.beginPath(); ctx.moveTo(27, 40); ctx.lineTo(33, 40); ctx.lineTo(37, 62); ctx.lineTo(30, 70); ctx.lineTo(23, 62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = member.color;
    ctx.font = '900 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${member.name} • ${member.role}`, 30, -8);
    ctx.restore();
  }

  function phase2StationInView(station, padding = 280) {
    return station.end - game.cameraX > -padding && station.start - game.cameraX < canvas.width + padding;
  }

  function drawWorld23MarqueeBackplate(station, time) {
    if (!phase2StationInView(station, 420)) return;
    const activation = station.completed ? 1 : clamp(station.progress, 0, .74);
    const toScreen = (worldX) => worldX - game.cameraX;
    ctx.save();

    if (images.welcomeCheckInBooth) {
      const booth = MARQUEE_WELCOME_BOOTH;
      const boothX = toScreen(booth.x);
      const boothY = booth.bottomY - booth.drawHeight;
      ctx.drawImage(
        images.welcomeCheckInBooth,
        0, 0, images.welcomeCheckInBooth.width, images.welcomeCheckInBooth.height,
        boothX, boothY, booth.drawWidth, booth.drawHeight,
      );
      const sign = booth.signPanel;
      const signX = toScreen(sign.x);
      ctx.shadowColor = '#50e7ff';
      ctx.shadowBlur = 8;
      roundedRect(signX, sign.y, sign.w, sign.h, 6, 'rgba(19,20,34,.96)', '#ffd65a', 2.2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff4cf';
      ctx.textAlign = 'center';
      ctx.font = '900 8px Arial';
      ctx.fillText('WELCOME', signX + sign.w / 2, sign.y + 12);
      ctx.fillStyle = '#50e7ff';
      ctx.font = '900 7.5px Arial';
      ctx.fillText('CHECK-IN', signX + sign.w / 2, sign.y + 23);
    }

    // One authored asset is the complete welcome arch: two towers, one sign,
    // one lower connection, one upper maintenance system, and grounded huts.
    // No legacy sign cell or additional scaffold tower is layered over it.
    if (images.marqueeStructure) {
      const imageX = toScreen(MARQUEE_STRUCTURE.centerX) - MARQUEE_STRUCTURE.drawWidth / 2;
      const imageY = MARQUEE_STRUCTURE.bottomY - MARQUEE_STRUCTURE.drawHeight;
      ctx.drawImage(
        images.marqueeStructure,
        0, 0, images.marqueeStructure.width, images.marqueeStructure.height,
        imageX, imageY, MARQUEE_STRUCTURE.drawWidth, MARQUEE_STRUCTURE.drawHeight,
      );
    } else {
      // A restrained structural fallback keeps the entrance readable if the
      // authored file is unavailable without recreating the removed v3 layers.
      const left = toScreen(MARQUEE_STRUCTURE.leftFootingX);
      const right = toScreen(MARQUEE_STRUCTURE.rightFootingX);
      drawPhase2Truss(left, 86, 96, GROUND_Y - 86, '#50e7ff');
      drawPhase2Truss(right, 86, 96, GROUND_Y - 86, '#ff4fac');
      drawPhase2Truss(left + 92, 170, right - left - 88, 42, '#ffd65a');
    }

    // The only runtime structure drawn over the asset is the moving lift's
    // fixed cable and pulley, aligned with the authored left-tower shaft.
    const liftRailX = toScreen(MARQUEE_STRUCTURE.liftRailX);
    ctx.strokeStyle = 'rgba(23,23,39,.94)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(liftRailX + 78, 156); ctx.lineTo(liftRailX + 78, 425); ctx.stroke();
    ctx.fillStyle = '#ffd65a'; ctx.strokeStyle = '#171727'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(liftRailX + 78, 154, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Tower and sign bulbs energize progressively before the lettering finishes.
    const lightPositions = [
      [3478, 366], [3485, 260], [3505, 150], [3605, 180],
      [3795, 180], [3900, 150], [3925, 260], [3930, 366],
    ];
    lightPositions.forEach(([worldX, y], index) => {
      const lit = station.completed || index / lightPositions.length < activation;
      ctx.fillStyle = lit ? ['#50e7ff', '#ff4fac', '#ffd65a'][index % 3] : '#403a50';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = lit ? 12 + Math.sin(time * .007 + index) * 2 : 0;
      ctx.beginPath(); ctx.arc(toScreen(worldX), y, lit ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawWorld23RoadieRooftopsBackplate(station, time) {
    if (!phase2StationInView(station, 760)) return;
    const toScreen = (worldX) => worldX - game.cameraX;
    const pulse = .55 + Math.sin(time * .0034) * .16;
    ctx.save();

    if (images.roadieLoadingAnnex) {
      // The authored loading annex is deliberately stretched slightly in the
      // horizontal direction so its painted freight tower meets the moving
      // lift's world-space rail while its awning and balcony retain their
      // authored vertical alignment with the collision route.
      ctx.drawImage(
        images.roadieLoadingAnnex,
        0, 0, images.roadieLoadingAnnex.width, images.roadieLoadingAnnex.height,
        toScreen(ROADIE_ROOFTOPS_STRUCTURE.startX),
        ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY - 330,
        1700,
        330,
      );
    } else {
      // A continuous, ground-bearing fallback loading complex carries the
      // ordinary street into the rehearsal tower if authored art is missing.
    const annexX = toScreen(ROADIE_ROOFTOPS_STRUCTURE.startX + 10);
    const annexWidth = ROADIE_ROOFTOPS_STRUCTURE.loadingAnnexEndX - ROADIE_ROOFTOPS_STRUCTURE.startX;
    const wall = ctx.createLinearGradient(0, 238, 0, ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY);
    wall.addColorStop(0, '#b85355');
    wall.addColorStop(.52, '#7a354f');
    wall.addColorStop(1, '#3b253e');
    roundedRect(annexX, 308, annexWidth, ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY - 308, 5, wall, '#2a1b32', 4);
    ctx.fillStyle = '#2b2637';
    ctx.fillRect(annexX, ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY - 15, annexWidth, 15);
    ctx.fillStyle = '#e2b766';
    ctx.fillRect(annexX, ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY - 15, annexWidth, 4);

    // Ground-level loading doors and real structural columns keep the long
    // approach readable as a functioning venue service bay rather than a wall.
    const loadingDoors = [
      { x: 11234, w: 274, label: 'ROADIE LOAD-IN' },
      { x: 11548, w: 286, label: 'EQUIPMENT BAY' },
      { x: 11922, w: 230, label: 'TOUR CASES' },
    ];
    loadingDoors.forEach((door, index) => {
      const x = toScreen(door.x);
      const y = index === 2 ? 344 : 332;
      const h = ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY - y - 13;
      const doorGradient = ctx.createLinearGradient(0, y, 0, y + h);
      doorGradient.addColorStop(0, '#343646');
      doorGradient.addColorStop(1, '#151722');
      roundedRect(x, y, door.w, h, 5, doorGradient, '#777d8d', 3);
      ctx.strokeStyle = 'rgba(211,218,225,.25)';
      ctx.lineWidth = 1.3;
      for (let seam = y + 18; seam < y + h - 8; seam += 15) {
        ctx.beginPath(); ctx.moveTo(x + 9, seam); ctx.lineTo(x + door.w - 9, seam); ctx.stroke();
      }
      roundedRect(x + 36, y + 11, door.w - 72, 22, 5, '#191a28', index === 1 ? '#50e7ff' : '#ff4fac', 2);
      ctx.fillStyle = '#fff0bd'; ctx.font = '900 8px Arial'; ctx.textAlign = 'center';
      ctx.fillText(door.label, x + door.w / 2, y + 26);
    });

    for (const columnWorldX of [11200, 11860, 12172, 12550, 12710]) {
      const x = toScreen(columnWorldX);
      const steel = ctx.createLinearGradient(x, 0, x + 24, 0);
      steel.addColorStop(0, '#171823'); steel.addColorStop(.48, '#707687'); steel.addColorStop(1, '#20212e');
      ctx.fillStyle = steel;
      ctx.fillRect(x, 292, 25, ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY - 292);
      ctx.fillStyle = '#ffd65a';
      ctx.fillRect(x - 5, ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY - 9, 35, 9);
      ctx.strokeStyle = 'rgba(80,231,255,.45)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x + 5, 301); ctx.lineTo(x + 20, ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY - 14); ctx.stroke();
    }

    // The roadie office and utility balcony form the intermediate climb while
    // staying visually attached to the loading-bay shell below.
    const officeX = toScreen(11870);
    const office = ctx.createLinearGradient(0, 222, 0, 349);
    office.addColorStop(0, '#d27956'); office.addColorStop(1, '#6d3150');
    roundedRect(officeX, 222, 690, 129, 7, office, '#30203a', 4);
    ctx.fillStyle = '#232231';
    ctx.fillRect(officeX - 18, 213, 726, 15);
    ctx.fillStyle = '#50e7ff';
    ctx.fillRect(officeX - 9, 213, 344, 4);
    ctx.fillStyle = '#ff4fac';
    ctx.fillRect(officeX + 354, 213, 345, 4);
    for (let windowIndex = 0; windowIndex < 4; windowIndex += 1) {
      const x = officeX + 38 + windowIndex * 158;
      const lit = station.completed || windowIndex / 4 < station.progress;
      roundedRect(x, 246, 112, 66, 5, lit ? '#173f50' : '#202331', lit ? '#50e7ff' : '#5f6170', 3);
      ctx.fillStyle = lit ? `rgba(255,214,90,${.24 + pulse * .2})` : 'rgba(255,255,255,.05)';
      ctx.fillRect(x + 8, 254, 96, 50);
      ctx.strokeStyle = 'rgba(255,244,204,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + 56, 250); ctx.lineTo(x + 56, 308); ctx.stroke();
    }
    }

    // A single authored service-cluster sheet replaces the former flat boxes.
    // Its two source crops are scaled independently so the POWER + SIGNAL roof
    // and lower HVAC cabinet align with their approved collision surfaces.
    const equipment = ROADIE_SERVICE_CLUSTER.equipment;
    const vent = ROADIE_SERVICE_CLUSTER.vent;
    const servicePowered = game.cableCrawler.utilityPowered || station.completed;
    if (images.roadieServiceCluster) {
      ctx.drawImage(
        images.roadieServiceCluster,
        equipment.source.x, equipment.source.y, equipment.source.w, equipment.source.h,
        toScreen(equipment.x), equipment.y, equipment.w, equipment.h,
      );
      ctx.drawImage(
        images.roadieServiceCluster,
        vent.source.x, vent.source.y, vent.source.w, vent.source.h,
        toScreen(vent.x), vent.y, vent.w, vent.h,
      );
    } else {
      const equipmentX = toScreen(equipment.x);
      const wall = ctx.createLinearGradient(0, equipment.y, 0, ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY);
      wall.addColorStop(0, '#c06452'); wall.addColorStop(.55, '#74334b'); wall.addColorStop(1, '#33243a');
      roundedRect(equipmentX, equipment.y + 95, equipment.w, 205, 7, wall, '#1b1b27', 5);
      roundedRect(equipmentX + 38, equipment.y + 142, 178, 143, 6, '#232633', '#858b99', 3);
      for (let seam = 0; seam < 7; seam += 1) {
        ctx.strokeStyle = 'rgba(214,220,230,.28)'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(equipmentX + 49, equipment.y + 158 + seam * 15);
        ctx.lineTo(equipmentX + 205, equipment.y + 158 + seam * 15); ctx.stroke();
      }
      roundedRect(equipmentX + 258, equipment.y + 152, 150, 94, 5, '#171b27', '#50e7ff', 3);
      for (let jack = 0; jack < 12; jack += 1) {
        ctx.fillStyle = ['#50e7ff', '#ff4fac', '#ffd65a'][jack % 3];
        ctx.beginPath(); ctx.arc(equipmentX + 278 + (jack % 4) * 34, equipment.y + 174 + Math.floor(jack / 4) * 25, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#242633'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(equipmentX + 278, equipment.y + 246); ctx.lineTo(equipmentX + 278, 455);
      ctx.moveTo(equipmentX + 322, equipment.y + 246); ctx.lineTo(equipmentX + 322, 455); ctx.stroke();

      const ventX = toScreen(vent.x);
      roundedRect(ventX, vent.y + 58, vent.w, 150, 8, '#292d39', '#747b88', 4);
      for (const centerX of [ventX + 107, ventX + 209]) {
        ctx.fillStyle = '#10131d'; ctx.strokeStyle = '#8c929e'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(centerX, vent.y + 125, 43, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        for (let blade = 0; blade < 6; blade += 1) {
          const angle = blade * Math.PI / 3;
          ctx.strokeStyle = '#4e5564'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(centerX, vent.y + 125);
          ctx.lineTo(centerX + Math.cos(angle) * 31, vent.y + 125 + Math.sin(angle) * 31); ctx.stroke();
        }
      }
    }

    const drawMountedServiceLabel = (panel, text, accent) => {
      const x = toScreen(panel.x);
      roundedRect(x, panel.y, panel.w, panel.h, 4, 'rgba(19,21,31,.95)', accent, 2);
      ctx.fillStyle = '#fff2c7';
      ctx.font = `900 ${text.length > 13 ? 8 : 9}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(text, x + panel.w / 2, panel.y + panel.h * .7);
      ctx.fillStyle = '#d8b76b';
      for (const boltX of [x + 6, x + panel.w - 6]) {
        ctx.beginPath(); ctx.arc(boltX, panel.y + 5, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    };
    drawMountedServiceLabel(equipment.label, ROADIE_SERVICE_CLUSTER.equipmentName, servicePowered ? '#a4f766' : '#b780ff');
    drawMountedServiceLabel(vent.label, 'VENT SERVICE', servicePowered ? '#a4f766' : '#50e7ff');

    // Subtle rotating highlights communicate airflow without covering the
    // authored fan blades or turning the utility annex into a particle cloud.
    for (let fanIndex = 0; fanIndex < vent.fanCenters.length; fanIndex += 1) {
      const fan = vent.fanCenters[fanIndex];
      const fanX = toScreen(fan.x);
      ctx.save();
      ctx.translate(fanX, fan.y);
      ctx.rotate(servicePowered ? time * .0014 * (fanIndex ? -1 : 1) : 0);
      ctx.strokeStyle = servicePowered ? 'rgba(164,247,102,.58)' : 'rgba(80,231,255,.22)';
      ctx.lineWidth = 2;
      for (let blade = 0; blade < 4; blade += 1) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(7, 0); ctx.quadraticCurveTo(22, -8, fan.r - 4, 0); ctx.stroke();
      }
      ctx.restore();
    }

    // Permanently mounted reinforced guide rails bridge the ground, balcony,
    // and upper utility roof; the authored cage is the only moving component.
    const railX = toScreen(ROADIE_ROOFTOPS_STRUCTURE.liftRailX);
    const railTop = 158;
    const railBottom = ROADIE_ROOFTOPS_STRUCTURE.buildingBottomY;
    const railMetal = ctx.createLinearGradient(railX, 0, railX + 188, 0);
    railMetal.addColorStop(0, '#151722'); railMetal.addColorStop(.45, '#747b8a'); railMetal.addColorStop(1, '#202331');
    for (const columnX of [railX + 14, railX + 168]) {
      roundedRect(columnX, railTop, 20, railBottom - railTop, 3, railMetal, '#0b0d14', 3);
      ctx.fillStyle = '#d8b768';
      ctx.fillRect(columnX - 4, railBottom - 8, 28, 8);
    }
    ctx.strokeStyle = '#535967'; ctx.lineWidth = 4;
    for (let braceY = railTop + 24; braceY < railBottom - 26; braceY += 42) {
      ctx.beginPath();
      ctx.moveTo(railX + 33, braceY); ctx.lineTo(railX + 168, braceY + 34);
      ctx.moveTo(railX + 168, braceY); ctx.lineTo(railX + 33, braceY + 34);
      ctx.stroke();
    }
    roundedRect(railX + 40, railTop - 42, 102, 44, 7, '#252936', '#d8b768', 3);
    ctx.fillStyle = '#0f1119'; ctx.strokeStyle = '#777e8c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(railX + 91, railTop - 20, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#151720'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(railX + 91, railTop - 5); ctx.lineTo(railX + 91, railBottom); ctx.stroke();
    ctx.fillStyle = servicePowered ? '#a4f766' : '#ff835c';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = servicePowered ? 9 : 4;
    ctx.beginPath(); ctx.arc(railX + 126, railTop - 26, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Preserve the premium authored tower's full source ratio. The previous
    // pass cropped 14% from the left and stretched the remainder into a
    // 1780 x 450 box, visibly widening the entire building. At 450 px high the
    // 1481 x 875 source is 762 px wide, which naturally matches the existing
    // 780 px rehearsal-roof collision and keeps Milo, Rex, and the sound rack
    // on their approved gameplay coordinates.
    if (images.roadieVenueTower) {
      const structure = ROADIE_ROOFTOPS_STRUCTURE;
      const sourceAspectDrawWidth = Math.round(
        structure.buildingDrawHeight * images.roadieVenueTower.width / images.roadieVenueTower.height,
      );
      ctx.drawImage(
        images.roadieVenueTower,
        0, 0, images.roadieVenueTower.width, images.roadieVenueTower.height,
        toScreen(structure.buildingX),
        structure.buildingBottomY - structure.buildingDrawHeight,
        sourceAspectDrawWidth,
        structure.buildingDrawHeight,
      );
    }

    // A thin shared footing visually seals the authored/code-native seam and
    // matches the continuous ground collision assembled for this district.
    const footingX = toScreen(ROADIE_ROOFTOPS_STRUCTURE.startX);
    const footingWidth = ROADIE_ROOFTOPS_STRUCTURE.endX - ROADIE_ROOFTOPS_STRUCTURE.startX;
    ctx.fillStyle = '#242431';
    ctx.fillRect(footingX, GROUND_Y - 7, footingWidth, 10);
    ctx.fillStyle = '#e0b765';
    ctx.fillRect(footingX, GROUND_Y - 7, footingWidth, 3);
    ctx.restore();
  }

  function drawWorld23Landmark(cellIndex, worldCenterX, bottomY, targetWidth, alpha = 1) {
    if (!images.world23Landmarks) return false;
    const bounds = images.world23LandmarkBounds?.[cellIndex];
    if (!bounds) return false;
    const screenCenterX = worldCenterX - game.cameraX;
    const targetHeight = targetWidth * (bounds.h / bounds.w);
    if (screenCenterX + targetWidth / 2 < -100 || screenCenterX - targetWidth / 2 > canvas.width + 100) return true;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      images.world23Landmarks,
      bounds.x, bounds.y, bounds.w, bounds.h,
      screenCenterX - targetWidth / 2, bottomY - targetHeight, targetWidth, targetHeight,
    );
    ctx.restore();
    return true;
  }

  function drawWorld23NeonMarquee(station, time) {
    if (!phase2StationInView(station, 420)) return;
    const panel = MARQUEE_STRUCTURE.signPanel;
    const x = panel.x - game.cameraX;
    const y = panel.y;
    const width = panel.w;
    const activation = station.completed ? 1 : clamp(station.progress * .86, .08, .7);
    ctx.save();
    ctx.shadowColor = '#50e7ff';
    ctx.shadowBlur = station.completed ? 23 : 6;
    roundedRect(x, y, width, panel.h, 15, 'rgba(45,24,38,.1)', station.completed ? '#fff4c5' : 'rgba(80,231,255,.5)', 2.2);
    const title = 'NEON NECKTIES';
    ctx.font = '900 17px Arial';
    ctx.textAlign = 'center';
    const letterWidth = 14;
    const startX = x + width / 2 - title.length * letterWidth / 2 + letterWidth / 2;
    const activeLetters = station.completed ? title.length : Math.floor(title.length * activation);
    [...title].forEach((letter, index) => {
      if (letter === ' ') return;
      const active = index < activeLetters;
      ctx.fillStyle = active ? ['#ff4fac', '#50e7ff', '#ffd65a'][index % 3] : 'rgba(255,255,255,.18)';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = active ? 10 + Math.sin(time * .008 + index) * 2 : 0;
      if (active) {
        ctx.strokeStyle = '#28162f';
        ctx.lineWidth = 3.5;
        ctx.strokeText(letter, startX + index * letterWidth, y + 32);
      }
      ctx.fillText(letter, startX + index * letterWidth, y + 32);
    });
    ctx.shadowBlur = 0;
    ctx.fillStyle = station.completed ? '#fff8dc' : 'rgba(255,255,255,.52)';
    ctx.font = '900 7px Arial';
    ctx.fillText(station.completed ? 'WELCOME ARCH • ONLINE' : 'WELCOME ARCH • STANDBY', x + width / 2, y + 50);
    for (let bulb = 0; bulb < 16; bulb += 1) {
      const lit = station.completed || bulb / 16 < activation;
      ctx.fillStyle = lit ? (bulb % 2 ? '#ff4fac' : '#ffd65a') : '#463b60';
      ctx.beginPath(); ctx.arc(x + 13 + bulb * 16, y + 7, lit ? 2.5 : 1.9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawRoadiePerformerSprite(image, worldCenterX, feetY, targetHeight, time, { mirror = false, phase = 0 } = {}) {
    if (!image) return false;
    const targetWidth = targetHeight * image.width / image.height;
    const screenX = worldCenterX - game.cameraX;
    if (screenX + targetWidth / 2 < -80 || screenX - targetWidth / 2 > canvas.width + 80) return true;
    ctx.save();
    ctx.translate(screenX, feetY);
    ctx.rotate(Math.sin(time * .004 + phase) * .008);
    ctx.scale(mirror ? -1 : 1, 1);
    ctx.drawImage(image, -targetWidth / 2, -targetHeight, targetWidth, targetHeight);
    ctx.restore();
    return true;
  }

  function drawWorld23RooftopSoundcheck(station, time) {
    if (!phase2StationInView(station, 620)) return;
    const beatPhase = station.beatPhase ?? ((game.levelTime / BASS_STACK_BEAT_SECONDS) % 1);
    const pulse = 1 - smoothStep(clamp(beatPhase / .34, 0, 1));
    const deckY = ROADIE_ROOFTOPS_STRUCTURE.rehearsalDeckY;
    const miloX = 14030;
    const rexX = 14330;

    // Rebuilt cabinets sit behind the performers and rest on the rehearsal
    // roof. Milo and Rex are clean-alpha standalone assets, so neither carries
    // the source sheet's white checkerboard nor intersects a speaker cabinet.
    drawRoadieSpeakerCabinet(13742 - game.cameraX, deckY - 91, 75, 91, pulse, '#a4f766');
    drawRoadieSpeakerCabinet(14410 - game.cameraX, deckY - 98, 79, 98, pulse, '#b780ff');
    roundedRect(14145 - game.cameraX, deckY - 55, 92, 55, 6, '#181a27', '#ffd65a', 2.4);
    for (let meter = 0; meter < 6; meter += 1) {
      ctx.fillStyle = meter / 6 < (.28 + pulse * .72) ? ['#a4f766', '#ffd65a', '#ff4fac'][meter % 3] : '#363847';
      ctx.fillRect(14159 - game.cameraX + meter * 11, deckY - 40, 7, 24 - meter % 2 * 7);
    }
    drawRoadiePerformerSprite(images.roadieMilo, miloX, deckY, 124, time, { phase: .3 });
    drawRoadiePerformerSprite(images.roadieRex, rexX, deckY, 126, time, { phase: 2.1 });

    // Restrained rehearsal accents originate from the actual instruments.
    ctx.save();
    ctx.globalAlpha = .18 + pulse * .68;
    ctx.strokeStyle = '#a4f766'; ctx.lineWidth = 2.2;
    for (let wave = 0; wave < 3; wave += 1) {
      ctx.beginPath();
      ctx.arc(miloX - game.cameraX + 4, deckY - 61, 18 + wave * 10 + pulse * 8, -.8, .8);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd65a'; ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 8;
    for (let spark = 0; spark < 4; spark += 1) {
      const angle = spark / 4 * Math.PI * 2 + time * .002;
      ctx.beginPath();
      ctx.arc(rexX - game.cameraX + 25 + Math.cos(angle) * (12 + pulse * 5), deckY - 66 + Math.sin(angle) * 9, 1.7 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center'; ctx.font = '900 9px Arial';
    ctx.fillStyle = '#a4f766'; ctx.fillText('MILO • BASS', miloX - game.cameraX, 17);
    ctx.fillStyle = '#b780ff'; ctx.fillText('REX • DRUMS', rexX - game.cameraX, 17);
    ctx.fillStyle = '#fff8dc'; ctx.font = '900 8px Arial';
    ctx.fillText(station.completed ? 'MASTER RACK • LOCKED IN' : 'LIVE ROOFTOP SOUNDCHECK', 14192 - game.cameraX, 32);
    ctx.restore();
  }

  function drawWorld23LagoonRehearsal(station, time) {
    if (!phase2StationInView(station, 620)) return;
    const glow = station.completed ? .52 : .18 + station.progress * .2;
    ctx.save();
    const water = ctx.createLinearGradient(0, 360, 0, GROUND_Y);
    water.addColorStop(0, `rgba(80,231,255,${glow})`);
    water.addColorStop(1, 'rgba(255,79,172,0)');
    ctx.fillStyle = water;
    ctx.fillRect(19580 - game.cameraX, 360, station.end - station.start, GROUND_Y - 360);
    ctx.restore();
    drawWorld23Landmark(2, 21635, GROUND_Y + 4, 650, .95);
    for (let light = 0; light < 6; light += 1) {
      const screenX = 20480 - game.cameraX + light * 270;
      const active = station.completed || light / 6 < station.progress;
      ctx.save(); ctx.fillStyle = active ? (light % 2 ? '#ff4fac' : '#50e7ff') : '#453d61';
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = active ? 14 : 3;
      ctx.beginPath(); ctx.arc(screenX, 238 + Math.sin(time * .004 + light) * 3, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    drawPreShowBandMember(1, 20715 - game.cameraX, 276, 150, time, { mirror: true });
    ctx.save(); ctx.fillStyle = '#50e7ff'; ctx.font = '900 9px Arial'; ctx.textAlign = 'center';
    ctx.fillText('JET • LAGOON GUITAR REHEARSAL', 20715 - game.cameraX, 116); ctx.restore();
  }

  function drawWorld23GoldenTicket(station, encore, time) {
    if (!phase2StationInView({ start: station.start, end: encore.end }, 620)) return;
    drawWorld23Landmark(3, 29215, GROUND_Y + 4, 600, .96);
    const flash = station.completed ? .7 + Math.sin(time * .01) * .2 : .2;
    ctx.save();
    for (let arrow = 0; arrow < 5; arrow += 1) {
      const x = 27870 - game.cameraX + arrow * 330;
      ctx.fillStyle = arrow % 2 ? `rgba(255,79,172,${flash})` : `rgba(255,214,90,${flash})`;
      ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x + 48, 110); ctx.lineTo(x + 48, 98);
      ctx.lineTo(x + 82, 125); ctx.lineTo(x + 48, 152); ctx.lineTo(x + 48, 140); ctx.lineTo(x, 140); ctx.closePath(); ctx.fill();
    }
    roundedRect(29085 - game.cameraX, 78, 280, 58, 16, 'rgba(37,21,58,.94)', '#ffd65a', 4);
    ctx.fillStyle = '#fff170'; ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = station.completed ? 22 : 7;
    ctx.font = '900 21px Arial'; ctx.textAlign = 'center'; ctx.fillText('GOLDEN TICKET', 29225 - game.cameraX, 114);
    ctx.restore();
    drawPreShowBandMember(3, 29285 - game.cameraX, 232, 148, time, { mirror: true });

    const curtainLeft = 29405 - game.cameraX;
    const curtainRight = 29955 - game.cameraX;
    ctx.save();
    const curtain = ctx.createLinearGradient(curtainLeft, 0, curtainRight, 0);
    curtain.addColorStop(0, '#401441'); curtain.addColorStop(.38, '#a42970');
    curtain.addColorStop(.5, 'rgba(25,12,52,.2)'); curtain.addColorStop(.62, '#8a225f'); curtain.addColorStop(1, '#35113d');
    ctx.fillStyle = curtain; ctx.globalAlpha = encore.completed ? .52 : .95;
    ctx.beginPath(); ctx.moveTo(curtainLeft, 0); ctx.lineTo(curtainLeft + 185, 0); ctx.lineTo(curtainLeft + 138, 170); ctx.lineTo(curtainLeft, 215); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(curtainRight - 190, 0); ctx.lineTo(curtainRight, 0); ctx.lineTo(curtainRight, 215); ctx.lineTo(curtainRight - 145, 172); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(curtainLeft, 3); ctx.lineTo(curtainRight, 3); ctx.stroke();
    ctx.restore();

    const stashX = 29745 - game.cameraX;
    ctx.save(); ctx.translate(stashX, 79);
    ctx.shadowColor = '#fff170'; ctx.shadowBlur = encore.completed ? 30 + Math.sin(time * .008) * 8 : 5;
    roundedRect(-100, -44, 200, 78, 10, '#201536', encore.completed ? '#fff170' : '#634b73', 4);
    ctx.fillStyle = encore.completed ? '#fff170' : '#50405f'; ctx.fillRect(-84, -28, 168, 9);
    ['#ff4fac', '#50e7ff', '#ffd65a'].forEach((color, index) => {
      ctx.fillStyle = encore.completed ? color : '#392b4d'; ctx.fillRect(-68 + index * 50, -8, 34, 19);
    });
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff8dc'; ctx.font = '900 8px Arial'; ctx.textAlign = 'center';
    ctx.fillText(encore.completed ? 'SPARE TIES • PICKS • SETLISTS' : 'NN • ROAD CASE 23', 0, 27);
    ctx.restore();
  }

  function drawWorld23Phase2Destinations(time) {
    if (game.phase2.preShowHidden) return;
    const marquee = world23Phase2Station('marquee');
    const rooftops = world23Phase2Station('rooftops');
    const lagoon = world23Phase2Station('lagoon');
    const golden = world23Phase2Station('golden');
    const encore = world23Phase2Station('encore');
    if (marquee) drawWorld23NeonMarquee(marquee, time);
    if (rooftops) drawWorld23RooftopSoundcheck(rooftops, time);
    if (lagoon) drawWorld23LagoonRehearsal(lagoon, time);
    if (golden && encore) drawWorld23GoldenTicket(golden, encore, time);
  }

  function drawCableCrawler(time) {
    if (game.phase2.preShowHidden) return;
    const left = CABLE_CRAWLER_ARENA.left - game.cameraX;
    const right = CABLE_CRAWLER_ARENA.right - game.cameraX;
    if (right < -120 || left > canvas.width + 120) return;
    const crawler = game.cableCrawler;
    const centerX = CABLE_CRAWLER_X - game.cameraX;
    const active = !['dormant', 'cleared'].includes(crawler.phase) && !crawler.defeated;

    if (crawler.sweep) {
      const progress = 1 - crawler.sweep.timer / crawler.sweep.duration;
      const sweepX = lerp(left + 26, right - 26, smoothStep(progress));
      ctx.save();
      ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.shadowColor = '#ff4fac'; ctx.shadowBlur = 13;
      ctx.beginPath();
      ctx.moveTo(centerX, CABLE_CRAWLER_ARENA.platformY - 61);
      ctx.quadraticCurveTo((centerX + sweepX) / 2, CABLE_CRAWLER_ARENA.platformY - 84, sweepX, CABLE_CRAWLER_ARENA.platformY - 29);
      ctx.stroke();
      ctx.fillStyle = '#fff170';
      ctx.beginPath(); ctx.arc(sweepX, CABLE_CRAWLER_ARENA.platformY - 29, 9, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    for (const target of crawler.plugTargets) {
      const x = target.x - game.cameraX;
      ctx.save();
      if (target.telegraph > 0) {
        const urgency = 1 - clamp(target.telegraph / 1.2, 0, 1);
        ctx.strokeStyle = urgency > .65 ? '#fff170' : '#50e7ff';
        ctx.lineWidth = 3 + urgency * 2;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.ellipse(x, CABLE_CRAWLER_ARENA.platformY - 5, 34, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(255,79,172,${.08 + urgency * .2})`;
        ctx.fillRect(x - 24, CABLE_CRAWLER_ARENA.platformY - 92, 48, 87);
      } else if (target.impact > 0) {
        const fade = clamp(target.impact / .5, 0, 1);
        ctx.fillStyle = `rgba(255,241,112,${.42 + fade * .38})`;
        ctx.shadowColor = '#ff4fac'; ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(x - 31, CABLE_CRAWLER_ARENA.platformY);
        ctx.lineTo(x - 9, CABLE_CRAWLER_ARENA.platformY - 128);
        ctx.lineTo(x + 9, CABLE_CRAWLER_ARENA.platformY - 128);
        ctx.lineTo(x + 31, CABLE_CRAWLER_ARENA.platformY);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    if (crawler.defeated || crawler.utilityPowered) {
      ctx.save();
      ctx.strokeStyle = '#a4f766'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.shadowColor = '#50e7ff'; ctx.shadowBlur = 11;
      ctx.beginPath();
      ctx.moveTo(centerX + 43, CABLE_CRAWLER_ARENA.platformY - 31);
      ctx.bezierCurveTo(centerX + 88, CABLE_CRAWLER_ARENA.platformY - 18, centerX + 128, 315, 13307 - game.cameraX, 315);
      ctx.stroke();
      ctx.fillStyle = '#fff170';
      roundedRect(13295 - game.cameraX, 305, 25, 22, 5, '#252936', '#a4f766', 2);
      ctx.restore();
    }

    const frame = crawler.defeated || crawler.phase === 'cleared' ? 3
      : crawler.phase === 'vulnerable' || crawler.phase === 'hurt' ? 2
        : ['sweepCharge', 'cableSweep', 'plugTelegraph', 'plugImpact'].includes(crawler.phase) ? 1 : 0;
    if (images.cableCrawler && images.cableCrawlerBounds?.[frame]) {
      const bounds = images.cableCrawlerBounds[frame];
      const height = frame === 1 ? 142 : frame === 2 ? 110 : frame === 3 ? 82 : 104;
      const width = height * bounds.w / bounds.h;
      const warningShake = crawler.phase === 'sweepCharge' ? Math.sin(time * .08) * 2 : 0;
      ctx.save();
      ctx.translate(centerX + warningShake, CABLE_CRAWLER_ARENA.platformY);
      ctx.shadowColor = crawler.phase === 'vulnerable' ? '#fff170'
        : crawler.utilityPowered ? '#a4f766' : '#ff4fac';
      ctx.shadowBlur = active ? 13 : 5;
      ctx.drawImage(
        images.cableCrawler,
        bounds.x, bounds.y, bounds.w, bounds.h,
        -width / 2, -height, width, height,
      );
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(centerX, CABLE_CRAWLER_ARENA.platformY - 45);
      ctx.strokeStyle = '#50e7ff'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      for (const direction of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(direction * 18, 5); ctx.quadraticCurveTo(direction * 48, 30, direction * 64, 42); ctx.stroke();
      }
      ctx.fillStyle = '#222532'; ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = crawler.phase === 'vulnerable' ? '#fff170' : '#ff4fac';
      ctx.beginPath(); ctx.arc(0, -7, 16, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    if (active) {
      const barWidth = 148;
      roundedRect(centerX - barWidth / 2, 143, barWidth, 28, 8, 'rgba(18,12,31,.9)', '#50e7ff', 2);
      ctx.fillStyle = '#fff3cc'; ctx.font = '900 9px Arial'; ctx.textAlign = 'center';
      ctx.fillText('CABLE CRAWLER', centerX, 154);
      ctx.fillStyle = '#292b38'; ctx.fillRect(centerX - 58, 159, 116, 6);
      ctx.fillStyle = '#ff4fac'; ctx.fillRect(centerX - 58, 159, 116 * (crawler.health / crawler.maxHealth), 6);
    }

    if (crawler.phase === 'vulnerable') {
      const core = cableCrawlerCore();
      const coreX = core.x + core.w / 2 - game.cameraX;
      const pulse = .86 + Math.sin(time * .02) * .14;
      ctx.save();
      ctx.strokeStyle = '#fff170'; ctx.lineWidth = 3; ctx.shadowColor = '#fff170'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.ellipse(coreX, core.y + 5, 43 * pulse, 13 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff8dc'; ctx.font = '900 8px Arial'; ctx.textAlign = 'center';
      ctx.fillText('STOMP!', coreX, core.y - 11);
      ctx.restore();
    }
  }

  function drawFeedbackFiendArena(time) {
    const arenaLeft = FEEDBACK_FIEND_ARENA.left - game.cameraX;
    const arenaRight = FEEDBACK_FIEND_ARENA.right - game.cameraX;
    if (arenaRight < -240 || arenaLeft > canvas.width + 240) return;
    const boss = game.boss;
    const active = boss.phase !== 'dormant' && boss.phase !== 'cleared';
    const defeated = boss.phase === 'defeated' || boss.phase === 'cleared';

    ctx.save();
    const stageGradient = ctx.createLinearGradient(0, GROUND_Y - 74, 0, GROUND_Y + 10);
    stageGradient.addColorStop(0, '#5f3b70'); stageGradient.addColorStop(1, '#1f1838');
    roundedRect(arenaLeft + 18, GROUND_Y - 18, arenaRight - arenaLeft - 36, 28, 7, stageGradient, '#50e7ff', 3);
    drawPhase2Truss(arenaLeft + 14, 106, 32, GROUND_Y - 124, '#ff4fac');
    drawPhase2Truss(arenaRight - 46, 106, 32, GROUND_Y - 124, '#50e7ff');
    drawPhase2Truss(arenaLeft + 14, 106, arenaRight - arenaLeft - 28, 36, '#ffd65a');
    for (let light = 0; light < 7; light += 1) {
      const x = arenaLeft + 74 + light * ((arenaRight - arenaLeft - 148) / 6);
      const color = ['#ff4fac', '#50e7ff', '#ffd65a'][light % 3];
      ctx.fillStyle = defeated ? 'rgba(255,255,255,.24)' : color;
      ctx.shadowColor = color; ctx.shadowBlur = active ? 13 : 4;
      ctx.beginPath(); ctx.arc(x, 141, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    roundedRect(FEEDBACK_FIEND_X - game.cameraX - 142, 71, 284, 46, 13, 'rgba(21,10,48,.92)', defeated ? '#a4f766' : '#ff4fac', 3);
    ctx.fillStyle = defeated ? '#a4f766' : '#fff4cc';
    ctx.font = '900 15px Arial'; ctx.textAlign = 'center';
    ctx.fillText(defeated ? 'FEEDBACK TAMED • SHOW PATH OPEN' : 'THE FEEDBACK FIEND', FEEDBACK_FIEND_X - game.cameraX, 99);

    if (active && !boss.gateOpen) {
      for (const gateX of [arenaLeft + 42, arenaRight - 42]) {
        ctx.strokeStyle = '#ff4fac'; ctx.lineWidth = 5; ctx.shadowColor = '#ff4fac'; ctx.shadowBlur = 13;
        for (let beam = 0; beam < 5; beam += 1) {
          ctx.beginPath(); ctx.moveTo(gateX - 14 + beam * 7, 158); ctx.lineTo(gateX - 14 + beam * 7, GROUND_Y - 18); ctx.stroke();
        }
      }
    }
    ctx.restore();

    for (const wave of boss.shockwaves) {
      const x = wave.x - game.cameraX;
      ctx.save();
      const fade = clamp(wave.life / 1.4, 0, 1);
      ctx.strokeStyle = `rgba(80,231,255,${.45 + fade * .45})`;
      ctx.lineWidth = 6; ctx.shadowColor = '#50e7ff'; ctx.shadowBlur = 15;
      for (let ring = 0; ring < 3; ring += 1) {
        ctx.beginPath();
        ctx.ellipse(x + wave.w / 2 + ring * 14, GROUND_Y - 24, 38 + ring * 18, 18 + ring * 8, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const drop of boss.feedbackDrops) {
      const x = drop.x - game.cameraX;
      ctx.save();
      if (drop.timer > 0) {
        const urgency = 1 - clamp(drop.timer / 1.55, 0, 1);
        ctx.strokeStyle = urgency > .68 ? '#fff170' : '#ff4fac';
        ctx.lineWidth = 4 + urgency * 3;
        ctx.setLineDash([9, 7]);
        ctx.beginPath(); ctx.ellipse(x, GROUND_Y - 7, 40 + Math.sin(time * .02) * 3, 11, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        const beam = ctx.createLinearGradient(x, 110, x, GROUND_Y);
        beam.addColorStop(0, 'rgba(255,79,172,0)'); beam.addColorStop(1, `rgba(255,79,172,${.12 + urgency * .28})`);
        ctx.fillStyle = beam; ctx.fillRect(x - 24, 110, 48, GROUND_Y - 110);
      } else {
        ctx.fillStyle = 'rgba(255,241,112,.72)'; ctx.shadowColor = '#ff4fac'; ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.moveTo(x - 40, GROUND_Y); ctx.lineTo(x - 12, GROUND_Y - 154);
        ctx.lineTo(x + 12, GROUND_Y - 154); ctx.lineTo(x + 40, GROUND_Y); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    if (boss.cableSweep) {
      const progress = 1 - boss.cableSweep.timer / boss.cableSweep.duration;
      const sweepX = lerp(FEEDBACK_FIEND_X - 100, FEEDBACK_FIEND_ARENA.left + 60, smoothStep(progress)) - game.cameraX;
      ctx.save(); ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.shadowColor = '#ff4fac'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.moveTo(FEEDBACK_FIEND_X - game.cameraX, GROUND_Y - 118); ctx.quadraticCurveTo(sweepX + 80, GROUND_Y - 150, sweepX, GROUND_Y - 84); ctx.stroke();
      ctx.fillStyle = '#fff170'; ctx.beginPath(); ctx.arc(sweepX, GROUND_Y - 84, 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    const frame = defeated ? 3
      : boss.phase === 'vulnerable' || boss.phase === 'hurt' ? 2
        : ['shockCharge', 'shockwave', 'feedbackDrop', 'cableCharge', 'cableSweep'].includes(boss.phase) ? 1 : 0;
    const centerX = FEEDBACK_FIEND_X - game.cameraX;
    const chargeShake = boss.phase === 'shockCharge' ? Math.sin(time * .08) * 3 : 0;
    if (images.feedbackFiend && images.feedbackFiendBounds?.[frame]) {
      const bounds = images.feedbackFiendBounds[frame];
      const height = 282;
      const width = height * (bounds.w / bounds.h);
      ctx.save(); ctx.translate(centerX + chargeShake, GROUND_Y);
      ctx.shadowColor = boss.phase === 'vulnerable' ? '#fff170' : defeated ? '#a4f766' : '#ff4fac';
      ctx.shadowBlur = active ? 18 : 7;
      ctx.drawImage(images.feedbackFiend, bounds.x, bounds.y, bounds.w, bounds.h, -width / 2, -height, width, height);
      ctx.restore();
    } else {
      drawPhase2SpeakerCabinet(centerX - 86, GROUND_Y - 238, 172, 238, active ? 1 : .2, '#ff4fac');
    }

    if (boss.phase === 'vulnerable') {
      const core = feedbackFiendCore();
      const coreX = core.x + core.w / 2 - game.cameraX;
      const pulse = .8 + Math.sin(time * .018) * .2;
      ctx.save(); ctx.strokeStyle = '#fff170'; ctx.lineWidth = 4; ctx.shadowColor = '#fff170'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.ellipse(coreX, core.y + 10, 62 * pulse, 18 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff8dc'; ctx.font = '900 9px Arial'; ctx.textAlign = 'center';
      ctx.fillText('STOMP!', coreX, core.y - 15); ctx.restore();
    }
  }

  function drawGenerator(generator, time) {
    const x = generator.x - game.cameraX;
    if (x < -120 || x > canvas.width + 120) return;
    const pulse = (Math.sin(time * .008 + generator.x) + 1) * .5;
    const remaining = world.enemies.filter((enemy) => enemy.generatorId === generator.id && enemy.alive).length;
    ctx.save();
    ctx.shadowColor = generator.color;
    ctx.shadowBlur = generator.activated ? 30 + pulse * 18 : remaining ? 14 + pulse * 10 : 8;
    if (!generator.activated && remaining) {
      ctx.strokeStyle = generator.color;
      ctx.globalAlpha = .34 + pulse * .18;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.arc(x, generator.y + 68, 72 + pulse * 8, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    roundedRect(x - 38, generator.y, 76, 144, 15, '#231848', generator.color, 4);
    ctx.fillStyle = generator.activated ? generator.color : 'rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.arc(x, generator.y + 50, 22 + pulse * 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff7dc';
    ctx.font = '900 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(generator.name, x, generator.y + 112, 68);
    ctx.fillStyle = generator.color;
    ctx.fillText(generator.activated ? 'ONLINE' : remaining ? `CLEAR ${remaining}` : 'READY', x, generator.y + 129);
    ctx.restore();
  }

  function drawPinata(time) {
    const pinata = game.pinata;
    const x = pinata.x - game.cameraX;
    if (x < -220 || x > canvas.width + 220) return;
    const burstY = GROUND_Y - 78;

    if (pinata.exploded) {
      if (pinata.explosionTimer <= 0) return;
      const progress = 1 - pinata.explosionTimer / 1.65;
      const fade = smoothStep(pinata.explosionTimer / .48);
      ctx.save();
      ctx.globalAlpha = fade;
      const glow = ctx.createRadialGradient(x, burstY, 8, x, burstY, 190 + progress * 90);
      glow.addColorStop(0, 'rgba(255,255,225,.92)');
      glow.addColorStop(.22, 'rgba(255,214,90,.48)');
      glow.addColorStop(.58, 'rgba(255,79,172,.2)');
      glow.addColorStop(1, 'rgba(80,231,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 300, burstY - 300, 600, 600);

      const ringColors = ['#ff4fac', '#ffd65a', '#50e7ff', '#a4f766', '#b780ff'];
      ringColors.forEach((color, index) => {
        ctx.globalAlpha = fade * (1 - progress) * (.84 - index * .08);
        ctx.strokeStyle = color;
        ctx.lineWidth = 8 - index;
        ctx.beginPath();
        ctx.arc(x, burstY, 42 + progress * (230 + index * 20) + index * 9, 0, Math.PI * 2);
        ctx.stroke();
      });

      if (images.neonPinata) {
        const cellWidth = images.neonPinata.width / 2;
        const cellHeight = images.neonPinata.height / 2;
        const size = 205 + Math.sin(progress * Math.PI) * 105;
        ctx.globalAlpha = fade;
        ctx.translate(x, burstY);
        ctx.rotate(Math.sin(time * .016) * .05);
        ctx.drawImage(
          images.neonPinata,
          cellWidth, cellHeight, cellWidth, cellHeight,
          -size / 2, -size / 2, size, size,
        );
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(x, GROUND_Y - 188);
      ctx.scale(1 + Math.sin(time * .02) * .05, 1 + Math.sin(time * .02) * .05);
      ctx.font = '900 24px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#24113f';
      ctx.lineWidth = 8;
      ctx.strokeText('TACO RAINBOW JACKPOT!', 0, 0);
      ctx.fillStyle = '#fff170';
      ctx.fillText('TACO RAINBOW JACKPOT!', 0, 0);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(x, GROUND_Y);
    ctx.rotate(Math.sin(time * .012) * .06 + pinata.wobble * Math.sin(time * .08) * .35);
    ctx.fillStyle = 'rgba(20,10,42,.36)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 53, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = ['#50e7ff', '#ffd65a', '#ff4fac'][pinata.hits];
    ctx.shadowBlur = 12 + pinata.hits * 8;
    if (images.neonPinata) {
      const cellWidth = images.neonPinata.width / 2;
      const cellHeight = images.neonPinata.height / 2;
      const frame = Math.min(2, pinata.hits);
      const frameColumn = frame % 2;
      const frameRow = Math.floor(frame / 2);
      ctx.drawImage(
        images.neonPinata,
        frameColumn * cellWidth, frameRow * cellHeight, cellWidth, cellHeight,
        -76, -150, 152, 152,
      );
    } else {
      const colors = ['#ff4fac', '#50e7ff', '#ffd65a', '#a4f766', '#b780ff'];
      for (let stripe = 0; stripe < 5; stripe += 1) {
        ctx.fillStyle = colors[stripe];
        ctx.beginPath();
        ctx.ellipse(0, -98 + stripe * 15, 42 - stripe * 2, 25, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-14, -86, 8, 0, Math.PI * 2); ctx.arc(14, -86, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#24143f';
      ctx.beginPath(); ctx.arc(-12, -86, 3, 0, Math.PI * 2); ctx.arc(16, -86, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#fff5bd';
    ctx.font = '900 14px Arial';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#261342';
    ctx.lineWidth = 5;
    ctx.strokeText(`NEON PIÑATA ${pinata.hits}/3`, x, GROUND_Y - 165);
    ctx.fillText(`NEON PIÑATA ${pinata.hits}/3`, x, GROUND_Y - 165);
  }

  function wrapChatBubbleText(message, maxWidth, font, maxLines = 2) {
    const words = String(message || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    ctx.save();
    ctx.font = font;
    const lines = [];
    let line = '';
    for (let index = 0; index < words.length; index += 1) {
      const candidate = line ? `${line} ${words[index]}` : words[index];
      if (ctx.measureText(candidate).width <= maxWidth || !line) {
        line = candidate;
        continue;
      }
      lines.push(line);
      line = words[index];
      if (lines.length === maxLines - 1) {
        const remainder = [line, ...words.slice(index + 1)].join(' ');
        let fitted = remainder;
        while (fitted.length > 3 && ctx.measureText(`${fitted}…`).width > maxWidth) fitted = fitted.slice(0, -1);
        lines.push(fitted === remainder ? fitted : `${fitted.trim()}…`);
        ctx.restore();
        return lines;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    ctx.restore();
    return lines;
  }

  function drawNpcChatBubble(message, color, options = {}) {
    const width = options.width || 128;
    const compact = Boolean(options.compact);
    const fontSize = options.fontSize || (String(message).length > 28 ? 7.5 : 8.5);
    const font = `900 ${fontSize}px Arial`;
    const lines = wrapChatBubbleText(message, width - 22, font, compact ? 2 : 3);
    const lineHeight = compact ? 9.5 : 10.5;
    const height = Math.max(compact ? 31 : 36, 15 + lines.length * lineHeight);
    const centerX = options.centerX || 0;
    const bottomY = options.bottomY ?? -136;
    const anchorX = options.anchorX || 0;
    const anchorY = options.anchorY ?? -112;
    const bubbleX = centerX - width / 2;
    const bubbleY = bottomY - height;
    const attachX = clamp(anchorX, bubbleX + 17, bubbleX + width - 17);

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = compact ? 9 : 14;
    const fill = ctx.createLinearGradient(0, bubbleY, 0, bottomY);
    fill.addColorStop(0, 'rgba(255,253,239,.98)');
    fill.addColorStop(1, 'rgba(235,242,255,.96)');
    ctx.fillStyle = fill;
    ctx.strokeStyle = color;
    ctx.lineWidth = compact ? 2 : 2.5;
    ctx.beginPath();
    ctx.moveTo(attachX - 8, bottomY - 1);
    ctx.lineTo(anchorX, anchorY);
    ctx.lineTo(attachX + 8, bottomY - 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    roundedRect(bubbleX, bubbleY, width, height, compact ? 12 : 15, fill, color, compact ? 2 : 2.5);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = .3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bubbleX + 13, bubbleY + 11, compact ? 2 : 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#281541';
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textCenterY = bubbleY + height / 2 + .5;
    lines.forEach((line, index) => {
      const y = textCenterY + (index - (lines.length - 1) / 2) * lineHeight;
      ctx.fillText(line, centerX, y, width - 20);
    });
    ctx.restore();
  }

  function drawFan(fan, index, time, camera = game.cameraX, showBubble = true) {
    const x = fan.x - camera;
    if (x < -160 || x > canvas.width + 160) return;
    const bounce = Math.sin(time * .007 + index * .8) * (4 + (index % 3));
    ctx.save();
    ctx.translate(x, GROUND_Y + bounce);
    if (images.bandOliviaCrowd) {
      const sprite = fanSpriteFrames[index % fanSpriteFrames.length];
      ctx.drawImage(images.bandOliviaCrowd, ...sprite, -42, -128, 84, 128);
      if (showBubble) {
        const tier = fan.bubbleTier || 0;
        drawNpcChatBubble(fan.message, fan.color, {
          centerX: (fan.bubbleSide || 1) * 8,
          bottomY: -138 - tier * 15,
          anchorX: 0,
          anchorY: -108,
          width: 124,
        });
      }
      ctx.restore();
      return;
    }
    const skin = ['#f0b78a', '#9b633f', '#d58f67', '#6f422e', '#c9835e', '#f2c4a4'][fan.look % 6];
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, -68, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ['#2d234d', '#5a295e', '#173c5b', '#3e5a35'][fan.look % 4];
    roundedRect(-17, -52, 34, 50, 9, ctx.fillStyle);
    ctx.fillStyle = fan.color;
    ctx.fillRect(-13, -48, 26, 20);
    ctx.strokeStyle = skin; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(-13, -42); ctx.lineTo(-28, -94); ctx.moveTo(13, -42); ctx.lineTo(28, -94); ctx.stroke();
    if (showBubble) {
      const tier = fan.bubbleTier || 0;
      drawNpcChatBubble(fan.message, fan.color, {
        centerX: (fan.bubbleSide || 1) * 8,
        bottomY: -105 - tier * 15,
        anchorX: 0,
        anchorY: -72,
        width: 124,
      });
    }
    ctx.restore();
  }

  function drawConcertAudienceMember(member, index, time, oliviaRoutine) {
    const beat = Math.sin(time * .008 + member.phase);
    const surfActive = oliviaRoutine.phase === 'surf-out' || oliviaRoutine.phase === 'surf-back';
    const distanceFromOlivia = Math.abs(member.x - oliviaRoutine.x);
    const supportStrength = surfActive ? smoothStep(1 - distanceFromOlivia / 175) : 0;
    const waveStrength = ['taco-tambourine', 'ground-dance'].includes(oliviaRoutine.phase)
      ? .5 + Math.sin(time * .0055 - member.x * .018) * .5
      : 0;
    const cheerStrength = Math.max(supportStrength, waveStrength * .72, index % 5 === 0 ? .35 : 0);
    const bounce = beat * (2.4 + member.row * .7);
    const shoulderY = -52;
    const relaxedHandY = -80 - (index % 3) * 7;
    const targetHandY = (oliviaRoutine.supportY + 4 - (member.baseY + bounce)) / member.scale;
    const handY = lerp(relaxedHandY, targetHandY, supportStrength);
    const armSpread = lerp(24 + (index % 2) * 5, 15 + Math.min(22, distanceFromOlivia * .08), supportStrength);
    const cheeringHandY = relaxedHandY - cheerStrength * (34 + (index % 4) * 4);
    const leftHandY = supportStrength > 0 ? handY : cheeringHandY;
    const rightHandY = supportStrength > 0 ? handY + Math.sin(member.phase) * 3 : cheeringHandY + Math.sin(member.phase) * 9;

    ctx.save();
    ctx.translate(member.x, member.baseY + bounce);
    ctx.scale(member.scale, member.scale);

    if (images.concertAudience) {
      const cellWidth = images.concertAudience.width / concertAudienceGrid.columns;
      const cellHeight = images.concertAudience.height / concertAudienceGrid.rows;
      const spriteColumn = member.sprite % concertAudienceGrid.columns;
      const spriteRow = Math.floor(member.sprite / concertAudienceGrid.columns);
      const visualHeight = [120, 136, 154][member.row];
      const visualWidth = visualHeight * (cellWidth / cellHeight);
      const supportStretch = 1 + supportStrength * .055;
      const cheerStretch = 1 + cheerStrength * .018;

      // Premium illustrated concertgoers pivot and stretch from their feet.
      // Their raised-hand silhouettes share Olivia's crowd-surf support line
      // without turning the audience back toward the camera.
      ctx.fillStyle = 'rgba(13,8,34,.28)';
      ctx.beginPath();
      ctx.ellipse(0, 1, visualWidth * .24, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(beat * .014 + Math.sin(member.phase) * .006);
      ctx.scale(member.mirror * cheerStretch, supportStretch);
      ctx.drawImage(
        images.concertAudience,
        spriteColumn * cellWidth, spriteRow * cellHeight, cellWidth, cellHeight,
        -visualWidth / 2, -visualHeight, visualWidth, visualHeight,
      );
      ctx.restore();
      return;
    }

    // Arms and hands are drawn first so every person reads as facing the stage,
    // with their shoulders and the backs of their heads in the foreground.
    ctx.strokeStyle = member.skin;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-15, shoulderY);
    ctx.quadraticCurveTo(-24, shoulderY - 18, -armSpread, leftHandY);
    ctx.moveTo(15, shoulderY);
    ctx.quadraticCurveTo(24, shoulderY - 18, armSpread, rightHandY);
    ctx.stroke();
    ctx.fillStyle = member.skin;
    ctx.beginPath();
    ctx.arc(-armSpread, leftHandY - 2, 5.2, 0, Math.PI * 2);
    ctx.arc(armSpread, rightHandY - 2, 5.2, 0, Math.PI * 2);
    ctx.fill();

    const shirtGradient = ctx.createLinearGradient(-22, -58, 22, -4);
    shirtGradient.addColorStop(0, member.shirt);
    shirtGradient.addColorStop(1, '#251b4c');
    roundedRect(-22, -58, 44, 62, 13, shirtGradient, 'rgba(255,255,255,.22)', 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.fillRect(-16, -48, 32, 5);
    ctx.fillStyle = member.skin;
    roundedRect(-7, -72, 14, 17, 5, member.skin);
    ctx.beginPath();
    ctx.arc(0, -82, 17, 0, Math.PI * 2);
    ctx.fill();

    // Hair is intentionally read from behind: no facial features point at the
    // player, so the entire audience is visually focused on the band.
    ctx.fillStyle = member.hair;
    ctx.beginPath();
    ctx.arc(0, -86, 17.5, Math.PI, Math.PI * 2);
    ctx.lineTo(16, -78);
    ctx.quadraticCurveTo(8, -68 - (index % 3) * 2, 0, -70);
    ctx.quadraticCurveTo(-9, -68, -16, -78);
    ctx.closePath();
    ctx.fill();
    if (index % 4 === 1) {
      ctx.beginPath();
      ctx.arc(12, -94, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawConcertAudience(time, oliviaRoutine) {
    for (let index = 0; index < concertAudience.length; index += 1) {
      drawConcertAudienceMember(concertAudience[index], index, time, oliviaRoutine);
    }
  }

  function drawConcertOlivia(time, oliviaRoutine) {
    if (oliviaRoutine.phase === 'waiting') return;
    if (oliviaRoutine.phase === 'surf-out' || oliviaRoutine.phase === 'surf-back') {
      const direction = oliviaRoutine.phase === 'surf-out' ? 1 : -1;
      ctx.save();
      // The crowd-surf sprite's lowest point sits 34 pixels above its local
      // origin, so this offset places Olivia directly on the fans' hand line.
      ctx.translate(oliviaRoutine.x + 37, oliviaRoutine.supportY + 34);
      ctx.rotate(direction * .05 + Math.sin(time * .0045) * .06);
      drawOlivia(-44, -80, time, 'crowd');
      ctx.restore();
      return;
    }

    const groundDance = oliviaRoutine.phase === 'ground-dance';
    const dance = Math.sin(time * (groundDance ? .012 : .009)) * (groundDance ? 8 : 5);
    const lift = Math.abs(Math.sin(time * (groundDance ? .0095 : .0065))) * (groundDance ? 19 : 8);
    ctx.save();
    ctx.translate(oliviaRoutine.x + dance, -lift);
    ctx.rotate(Math.sin(time * .01) * (groundDance ? .045 : .025));
    if (groundDance) {
      ctx.fillStyle = 'rgba(11,8,34,.34)';
      ctx.beginPath();
      ctx.ellipse(0, GROUND_Y + lift - 2, 34 - lift * .25, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      drawOlivia(-39, GROUND_Y - 100, time, 5);
      ctx.fillStyle = '#ffd65a';
      for (let note = 0; note < 3; note += 1) {
        const noteX = -54 + note * 52 + Math.sin(time * .006 + note) * 6;
        const noteY = 338 - note * 17 - Math.abs(Math.sin(time * .005 + note)) * 18;
        ctx.font = `900 ${18 + note * 2}px Arial`;
        ctx.fillText(note % 2 ? '♪' : '♫', noteX, noteY);
      }
      ctx.restore();
      return;
    }

    ctx.shadowColor = '#ffd65a';
    ctx.shadowBlur = 16;
    roundedRect(-50, 409, 104, 18, 9, '#30235c', '#50e7ff', 3);
    ctx.shadowBlur = 0;
    drawOlivia(-39, 310, time, 5);

    if (oliviaRoutine.phase === 'taco-tambourine') {
      // The premium prop cycles through four authored shake poses while
      // Olivia's whole stance bobs and follows through on the beat.
      ctx.save();
      ctx.translate(25, 343);
      ctx.rotate(Math.sin(time * .014) * .2);
      if (images.tacoTambourine) {
        const frame = Math.floor(time * .012) % 4;
        const cellWidth = images.tacoTambourine.width / 2;
        const cellHeight = images.tacoTambourine.height / 2;
        ctx.shadowColor = frame % 2 ? '#ff4fac' : '#50e7ff';
        ctx.shadowBlur = 14;
        ctx.drawImage(
          images.tacoTambourine,
          (frame % 2) * cellWidth, Math.floor(frame / 2) * cellHeight, cellWidth, cellHeight,
          -21, -21, 42, 42,
        );
      } else {
        ctx.fillStyle = '#f0a93a';
        ctx.strokeStyle = '#fff1a2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 16, Math.PI, 0);
        ctx.lineTo(14, 9);
        ctx.quadraticCurveTo(0, 18, -14, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      for (let note = 0; note < 4; note += 1) {
        const angle = time * .008 + note * Math.PI / 2;
        ctx.fillStyle = note % 2 ? '#ff4fac' : '#50e7ff';
        ctx.font = '900 17px Arial';
        ctx.fillText(note % 2 ? '♪' : '♫', 25 + Math.cos(angle) * 34, 343 + Math.sin(angle) * 26);
      }
    }
    ctx.restore();
  }

  function drawChorusTacoCannons(time) {
    const activeWindow = CHORUS_WINDOWS.some((windowDef) => (
      game.concert.timer >= windowDef.start && game.concert.timer < windowDef.end
    ));
    for (const side of [-1, 1]) {
      const x = side === -1 ? 47 : canvas.width - 47;
      const direction = side === -1 ? 1 : -1;
      ctx.save();
      ctx.translate(x, 402);
      ctx.scale(direction, 1);
      ctx.rotate(-.22);
      ctx.shadowColor = side === -1 ? '#50e7ff' : '#ff4fac';
      ctx.shadowBlur = activeWindow ? 20 : 8;
      const barrel = ctx.createLinearGradient(-20, 0, 40, 0);
      barrel.addColorStop(0, '#30225d');
      barrel.addColorStop(.55, side === -1 ? '#2dc5db' : '#d83b91');
      barrel.addColorStop(1, '#ffe177');
      roundedRect(-24, -16, 72, 32, 12, barrel, '#fff1aa', 3);
      roundedRect(-12, 11, 30, 30, 8, '#2b1d55', '#ffd65a', 3);
      ctx.fillStyle = '#16102f';
      ctx.beginPath();
      ctx.ellipse(48, 0, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      if (game.concert.cannonFlash > 0) {
        const flash = game.concert.cannonFlash / .48;
        ctx.globalAlpha = flash;
        ctx.fillStyle = '#fff8a8';
        ctx.beginPath();
        ctx.moveTo(55, 0);
        ctx.lineTo(82 + flash * 22, -20);
        ctx.lineTo(70 + flash * 10, 0);
        ctx.lineTo(82 + flash * 22, 20);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    if (activeWindow) {
      ctx.save();
      ctx.globalAlpha = .82 + Math.sin(time * .012) * .14;
      ctx.shadowColor = '#ff4fac';
      ctx.shadowBlur = 18;
      roundedRect(352, 112, 256, 44, 18, 'rgba(25,12,61,.88)', '#ffd65a', 3);
      ctx.fillStyle = '#fff5c7';
      ctx.font = '900 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('JUMP FOR TACOS!', 480, 141);
      ctx.restore();
    }
  }

  function drawBoat(time) {
    if (!game.boat.active || player.x < 22200 || player.x > 27200) return;
    const x = game.boat.x - game.cameraX;
    const throwProgress = game.boat.throwTimer > 0
      ? 1 - clamp(game.boat.throwTimer / BOAT_THROW_DURATION, 0, 1)
      : -1;

    // A local animated water lane locks the illustrated hull to the lagoon
    // surface even while the background parallax moves behind it.
    ctx.save();
    const water = ctx.createRadialGradient(x, BOAT_WATERLINE_Y + 9, 20, x, BOAT_WATERLINE_Y + 9, 195);
    water.addColorStop(0, 'rgba(57,218,231,.48)');
    water.addColorStop(.62, 'rgba(27,150,197,.24)');
    water.addColorStop(1, 'rgba(15,81,151,0)');
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.ellipse(x, BOAT_WATERLINE_Y + 10, 195, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(164,247,255,.72)';
    ctx.lineWidth = 3;
    for (let ripple = 0; ripple < 5; ripple += 1) {
      const rippleX = x - 170 + ripple * 80 + Math.sin(time * .006 + ripple) * 13;
      ctx.beginPath();
      ctx.ellipse(rippleX, BOAT_WATERLINE_Y + 2 + (ripple % 2) * 7, 31, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (images.catamaranRemasterBase) {
      const drawWidth = BOAT_RENDER_WIDTH;
      const drawHeight = drawWidth * (images.catamaranRemasterBase.height / images.catamaranRemasterBase.width);
      const drawLeft = x - drawWidth / 2;
      const drawTop = BOAT_WATERLINE_Y - drawHeight + 23;
      ctx.save();
      ctx.shadowColor = '#50e7ff';
      ctx.shadowBlur = 9;
      ctx.drawImage(images.catamaranRemasterBase, drawLeft, drawTop, drawWidth, drawHeight);
      ctx.restore();
      game.boatLayeringReady = true;
    } else if (images.islandCatamaran) {
      const cellSize = images.islandCatamaran.width / 3;
      const drawWidth = BOAT_RENDER_WIDTH;
      const drawHeight = drawWidth;
      ctx.save();
      ctx.shadowColor = '#50e7ff';
      ctx.shadowBlur = 9;
      ctx.drawImage(
        images.islandCatamaran,
        0, 0, cellSize, cellSize,
        x - drawWidth / 2, BOAT_WATERLINE_Y - drawHeight + 28,
        drawWidth, drawHeight,
      );
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(x, BOAT_WATERLINE_Y - 38);
      ctx.fillStyle = '#ff4fac';
      ctx.beginPath(); ctx.moveTo(-58, -12); ctx.lineTo(72, -12); ctx.lineTo(56, 18); ctx.lineTo(-40, 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#50e7ff';
      ctx.fillRect(-40, -21, 96, 10);
      ctx.fillStyle = '#fff3bd';
      ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, -82); ctx.lineTo(56, -31); ctx.closePath(); ctx.fill();
      drawOlivia(-48, -72, time, 1);
      ctx.restore();
    }

    // Olivia remains in one calm driving pose. A compact flare at the stern
    // makes the taco launcher readable without compositing a throwing arm.
    if (game.boat.launchFlash > 0 || (throwProgress >= BOAT_THROW_RELEASE && throwProgress < .7)) {
      const flash = Math.max(
        clamp(game.boat.launchFlash / .22, 0, 1),
        throwProgress >= 0 ? 1 - clamp(Math.abs(throwProgress - BOAT_THROW_RELEASE) / .24, 0, 1) : 0,
      );
      const launchX = x + BOAT_LAUNCH_X_OFFSET;
      const launchY = BOAT_WATERLINE_Y + BOAT_LAUNCH_Y_OFFSET;
      ctx.save();
      ctx.globalAlpha = .35 + flash * .65;
      ctx.shadowColor = '#ffd65a';
      ctx.shadowBlur = 12 + flash * 14;
      ctx.fillStyle = '#fff3a6';
      for (let ray = 0; ray < 6; ray += 1) {
        const angle = Math.PI + (ray - 2.5) * .23;
        ctx.beginPath();
        ctx.moveTo(launchX, launchY);
        ctx.lineTo(launchX + Math.cos(angle) * (18 + flash * 22), launchY + Math.sin(angle) * (18 + flash * 22));
        ctx.lineWidth = 3;
        ctx.strokeStyle = ray % 2 ? '#50e7ff' : '#ffd65a';
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(launchX, launchY, 5 + flash * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Foreground foam and a trailing wake show forward travel while the hull
    // itself remains steady; none of this motion changes the boat's anchor.
    ctx.save();
    ctx.globalAlpha = .9;
    ctx.fillStyle = '#eaffff';
    for (let foam = 0; foam < 9; foam += 1) {
      const foamX = x - 148 + foam * 37 + Math.sin(time * .009 + foam) * 6;
      ctx.beginPath();
      ctx.ellipse(foamX, BOAT_WATERLINE_Y + 4 + (foam % 3), 16 + foam % 3 * 4, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(218,255,255,.78)';
    ctx.lineWidth = 4;
    for (let wake = 0; wake < 3; wake += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 132 - wake * 18, BOAT_WATERLINE_Y + 1 + wake * 5);
      ctx.quadraticCurveTo(
        x - 198 - wake * 32,
        BOAT_WATERLINE_Y - 9 + Math.sin(time * .006 + wake) * 4,
        x - 252 - wake * 36,
        BOAT_WATERLINE_Y + 7 + wake * 7,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer(time, concertMode = false) {
    if (heroCore.hidePlayerDuringRespawn(game.respawn)) return;
    const x = concertMode ? player.x : player.x - game.cameraX;
    const y = player.y + player.h / 2;
    abilities.drawHeroEffects(ctx, game.abilities, player, game.cameraX, time, { x, y: player.y, reducedMotion: game.reducedShake });
    if (images.hero) {
      const frame = game.state === 'results' ? 7
        : player.invulnerable > 0 ? 6
        : !player.grounded ? (player.vy < 0 ? 4 : 5)
        : Math.abs(player.vx) > 24 ? 1 + Math.floor(player.anim) % 3 : 0;
      const running = frame >= 1 && frame <= 3 && !concertMode;
      const visualSize = concertMode ? 70 : 66;
      ctx.save();
      ctx.globalAlpha = player.grounded ? .22 : .1;
      ctx.fillStyle = '#17102e';
      ctx.beginPath();
      ctx.ellipse(x + player.w / 2, player.y + player.h + 4, player.grounded ? 25 : 17, player.grounded ? 6 : 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) ctx.globalAlpha = .45;
      ctx.translate(x + player.w / 2, y);
      ctx.rotate(player.rotation || 0);
      abilities.applyHeroVisualTransform(ctx, game.abilities, { direction: player.dir, baseScale: player.scale || 1, anchorY: visualSize / 2, time });
      if (abilities.isFrenzy(game.abilities)) {
        ctx.shadowColor = '#50e7ff';
        ctx.shadowBlur = 28;
        ctx.strokeStyle = '#50e7ff';
        ctx.globalAlpha *= .72;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 27, 27 + Math.sin(time * .012) * 2, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      abilities.applyHeroStyle(ctx, game.abilities);
      abilities.drawHeroSpriteFrame(ctx, game.abilities, images.hero, frame, {
        x: -visualSize / 2,
        y: -visualSize / 2,
        width: visualSize,
        height: visualSize,
        running,
        animation: player.anim,
      });
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x + player.w / 2, y + player.h / 2);
    ctx.rotate(player.rotation || 0);
    abilities.applyHeroVisualTransform(ctx, game.abilities, { direction: player.dir, baseScale: player.scale || 1, anchorY: 22, time });
    const squash = player.grounded ? 1 + Math.sin(time * .015) * .02 : 1;
    ctx.scale(1 / squash, squash);
    ctx.shadowColor = '#ffd65a';
    ctx.shadowBlur = abilities.isFrenzy(game.abilities) ? 24 : 8;
    abilities.applyHeroStyle(ctx, game.abilities);
    ctx.fillStyle = '#f5ba4d';
    ctx.beginPath();
    ctx.arc(0, 1, 20, Math.PI, 0);
    ctx.lineTo(20, 9);
    ctx.quadraticCurveTo(0, 20, -20, 9);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#61c968'; ctx.fillRect(-14, 0, 28, 5);
    ctx.fillStyle = '#ef5f55'; ctx.fillRect(-10, 5, 20, 4);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-7, -6, 5, 0, Math.PI * 2); ctx.arc(7, -6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#25113e';
    ctx.beginPath(); ctx.arc(-6, -5, 2, 0, Math.PI * 2); ctx.arc(8, -5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#25113e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(1, 4, 8, .2, Math.PI - .2); ctx.stroke();
    ctx.fillStyle = '#ff4fac';
    ctx.fillRect(-14, 16, 10, 9);
    ctx.fillStyle = '#50e7ff';
    ctx.fillRect(4, 16, 10, 9);
    ctx.restore();
  }

  function drawEffects() {
    for (const particle of game.particles) {
      ctx.globalAlpha = clamp(particle.life, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill();
    }
    for (const piece of game.confetti) {
      ctx.globalAlpha = clamp(piece.life, 0, 1);
      ctx.save(); ctx.translate(piece.x, piece.y); ctx.rotate(piece.angle);
      ctx.fillStyle = piece.color; ctx.fillRect(-piece.size / 2, -piece.size / 3, piece.size, piece.size * .6); ctx.restore();
    }
    for (const firework of game.fireworks) {
      if (firework.delay > 0) continue;
      ctx.globalAlpha = clamp(firework.life, 0, 1);
      ctx.strokeStyle = firework.color;
      ctx.lineWidth = 3;
      for (let ray = 0; ray < 12; ray += 1) {
        const angle = ray / 12 * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(firework.x + Math.cos(angle) * firework.radius * .45, firework.y + Math.sin(angle) * firework.radius * .45);
        ctx.lineTo(firework.x + Math.cos(angle) * firework.radius, firework.y + Math.sin(angle) * firework.radius);
        ctx.stroke();
      }
    }
    for (const text of game.impactTexts) {
      ctx.globalAlpha = clamp(text.life, 0, 1);
      ctx.textAlign = 'center';
      ctx.font = '900 22px Arial';
      ctx.strokeStyle = '#21133f'; ctx.lineWidth = 6; ctx.strokeText(text.text, text.x, text.y);
      ctx.fillStyle = text.color; ctx.fillText(text.text, text.x, text.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawWorld23Phase2Overlay(time) {
    if (game.state === 'concert' || game.state === 'results') return;
    const activeDialogue = world.phase2Stations.find((station) => station.dialogue && station.dialogueTimer > 0);
    if (activeDialogue && !game.phase2.preShowHidden) {
      const speaker = activeDialogue.id === 'rooftops' ? 'MILO + REX • ROOFTOP SOUNDCHECK'
        : activeDialogue.id === 'lagoon' ? 'JET • LAGOON REHEARSAL'
          : 'ARMAN • GOLDEN TICKET';
      const entrance = smoothStep(clamp((3.2 - activeDialogue.dialogueTimer) / .2, 0, 1));
      const exit = smoothStep(clamp(activeDialogue.dialogueTimer / .25, 0, 1));
      ctx.save();
      ctx.globalAlpha = entrance * exit;
      ctx.translate((1 - entrance) * -16, 0);
      roundedRect(24, 344, 342, 66, 18, 'rgba(22,10,52,.94)', activeDialogue.accent, 4);
      ctx.fillStyle = activeDialogue.accent;
      ctx.beginPath(); ctx.arc(48, 367, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8dc';
      ctx.font = '900 10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(speaker, 66, 369, 282);
      ctx.fillStyle = activeDialogue.accent;
      ctx.font = '900 14px Arial';
      ctx.fillText(activeDialogue.dialogue, 42, 394, 306);
      ctx.restore();
    }
    if (game.phase2.toast) {
      const toast = game.phase2.toast;
      const entrance = smoothStep(clamp((2.75 - toast.timer) / .24, 0, 1));
      const exit = smoothStep(clamp(toast.timer / .28, 0, 1));
      const alpha = entrance * exit;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(0, (1 - entrance) * 22);
      roundedRect(604, 446, 334, 72, 18, 'rgba(20,10,48,.92)', toast.color, 4);
      ctx.fillStyle = toast.color;
      ctx.font = '900 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(toast.title, 771, 474, 306);
      ctx.fillStyle = '#fff8dc';
      ctx.font = '900 9px Arial';
      ctx.fillText(toast.subtitle, 771, 497, 306);
      ctx.fillStyle = toast.color;
      for (let sparkle = 0; sparkle < 6; sparkle += 1) {
        const angle = time * .003 + sparkle * Math.PI / 3;
        ctx.beginPath();
        ctx.arc(771 + Math.cos(angle) * 142, 482 + Math.sin(angle) * 25, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (game.phase2.secretBanner) {
      const banner = game.phase2.secretBanner;
      const entrance = smoothStep(clamp((3.35 - banner.timer) / .34, 0, 1));
      const exit = smoothStep(clamp(banner.timer / .42, 0, 1));
      const alpha = entrance * exit;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(canvas.width / 2, 238);
      ctx.scale(.88 + entrance * .12 + Math.sin(time * .012) * .008, .88 + entrance * .12);
      const glow = ctx.createRadialGradient(0, 0, 18, 0, 0, 330);
      glow.addColorStop(0, 'rgba(255,241,112,.36)');
      glow.addColorStop(1, 'rgba(255,79,172,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-350, -130, 700, 260);
      roundedRect(-288, -68, 576, 136, 28, 'rgba(22,9,50,.96)', '#fff170', 6);
      ctx.fillStyle = '#fff170';
      ctx.font = '900 34px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(banner.title, 0, -12, 520);
      ctx.fillStyle = '#50e7ff';
      ctx.font = '900 23px Arial';
      ctx.fillText(banner.subtitle, 0, 31, 520);
      ctx.fillStyle = '#fff8dc';
      ctx.font = '900 10px Arial';
      ctx.fillText('RAINBOW TACOS • TOUR MEMORABILIA • SCORE JACKPOT', 0, 52, 520);
      ctx.restore();
    }
  }

  function drawHUD(time) {
    ctx.save();
    const marqueeHudGhost = game.state === 'playing'
      && player.x >= 3000 && player.x <= 4380 && player.y < 210;
    if (marqueeHudGhost) ctx.globalAlpha = .28;
    roundedRect(18, 16, 330, 124, 16, 'rgba(20,10,48,.62)', 'rgba(80,231,255,.42)');
    ctx.fillStyle = '#fff5cf';
    ctx.font = '900 19px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(game.state === 'concert' ? 'WORLD 2-3 • NEON CONCERT' : 'WORLD 2-3 • TURN THE SUNSET UP', 34, 43);
    ctx.font = '900 13px Arial';
    ctx.fillText(`Score ${game.score.toLocaleString()}   Tacos ${game.collected}/${game.totalTacos}`, 34, 68);
    ctx.fillStyle = '#ffd65a';
    ctx.fillText(`Backstage ${Math.min(game.golden, game.totalGolden)}/${game.totalGolden}   Splats ${game.bestSplat}`, 34, 90);
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    roundedRect(34, 106, 294, 13, 7, 'rgba(255,255,255,.16)');
    const energyGradient = ctx.createLinearGradient(34, 0, 328, 0);
    energyGradient.addColorStop(0, '#50e7ff'); energyGradient.addColorStop(.5, '#ff4fac'); energyGradient.addColorStop(1, '#ffd65a');
    roundedRect(34, 106, 294 * game.energy / 100, 13, 7, energyGradient);
    ctx.fillStyle = '#fff5cf'; ctx.font = '900 9px Arial'; ctx.fillText(`CONCERT ENERGY ${Math.round(game.energy)}%`, 38, 116);
    abilities.drawTacoPowerHUD(ctx, game.abilities, { x: 34, y: 129, width: 294, height: 7, labelX: 38, labelY: 127, textColor: '#fff5cf', font: '900 8px Arial' });

    if (game.state !== 'concert') {
      roundedRect(385, 18, 338, 70, 18, 'rgba(20,10,48,.62)', 'rgba(255,79,172,.38)');
      const section = sections[game.sectionIndex];
      ctx.fillStyle = section.accent;
      ctx.font = '900 15px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(section.name.toUpperCase(), 554, 46);
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      roundedRect(410, 60, 288, 8, 4, 'rgba(255,255,255,.16)');
      roundedRect(410, 60, 288 * clamp(player.x / WORLD_WIDTH, 0, 1), 8, 4, section.accent);
      ctx.fillStyle = '#fff'; ctx.font = '900 9px Arial'; ctx.fillText(`${Math.round(player.x).toLocaleString()} / 35,000`, 554, 82);
    } else {
      roundedRect(385, 18, 338, 70, 18, 'rgba(20,10,48,.66)', 'rgba(255,214,90,.46)');
      ctx.fillStyle = '#ffd65a';
      ctx.font = '900 15px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('NEON NECKTIES • JUMP FOR TACOS', 554, 44);
      const progress = clamp(game.concert.timer / game.concert.duration, 0, 1);
      roundedRect(410, 58, 288, 9, 5, 'rgba(255,255,255,.16)');
      roundedRect(410, 58, 288 * progress, 9, 5, '#ff4fac');
      ctx.fillStyle = '#fff'; ctx.font = '900 10px Arial';
      ctx.fillText(`${formatTime(game.concert.timer)} / 3:07`, 554, 82);
    }
    ctx.globalAlpha = 1;
    if (game.state !== 'concert' && game.boss.phase !== 'dormant' && game.boss.phase !== 'cleared') {
      const bossColor = game.boss.phase === 'vulnerable' ? '#fff170' : game.boss.defeated ? '#a4f766' : '#ff4fac';
      roundedRect(735, 84, 207, 48, 14, 'rgba(20,10,48,.76)', bossColor, 3);
      ctx.fillStyle = bossColor; ctx.font = '900 10px Arial'; ctx.textAlign = 'center';
      ctx.fillText(game.boss.defeated ? 'FEEDBACK TAMED' : 'FEEDBACK FIEND', 838, 101);
      for (let hit = 0; hit < FEEDBACK_FIEND_MAX_HEALTH; hit += 1) {
        const alive = hit < game.boss.health;
        roundedRect(770 + hit * 46, 111, 34, 9, 5, alive ? bossColor : 'rgba(255,255,255,.16)');
      }
    }
    if (abilities.isFrenzy(game.abilities)) {
      ctx.fillStyle = '#50e7ff';
      ctx.font = '900 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`TACO FRENZY ${Math.ceil(game.abilities.frenzyTimer)}s`, 936, 74);
    } else if (abilities.hasMagnet(game.abilities)) {
      ctx.fillStyle = '#ffd65a';
      ctx.font = '900 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`TACO MAGNET ${Math.ceil(game.abilities.magnetTimer)}s`, 936, 74);
    }

    for (let heart = 0; heart < 3; heart += 1) {
      const x = 890 + heart * 24;
      ctx.fillStyle = heart < game.hearts ? '#ff5bac' : 'rgba(255,255,255,.18)';
      ctx.beginPath(); ctx.arc(x, 31, 7, 0, Math.PI * 2); ctx.arc(x + 12, 31, 7, 0, Math.PI * 2); ctx.lineTo(x + 6, 48); ctx.fill();
    }
    if (game.messageTimer > 0) {
      const scale = 1 + Math.sin(time * .012) * .025;
      ctx.translate(canvas.width / 2, 160);
      ctx.scale(scale, scale);
      ctx.font = `900 ${game.message.length > 62 ? 16 : game.message.length > 42 ? 20 : 28}px Arial`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#180d3b'; ctx.lineWidth = 8; ctx.strokeText(game.message, 0, 0, 890);
      ctx.fillStyle = game.state === 'concert' ? '#ffd65a' : currentSection().accent;
      ctx.fillText(game.message, 0, 0, 890);
    }
    ctx.restore();
  }

  function drawOpeningTacoSprite(x, y, size, angle, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowColor = '#ffd65a';
    ctx.shadowBlur = 9;
    if (images.items) {
      ctx.drawImage(images.items, 0, 0, 16, 16, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = '#f4b64c';
      ctx.beginPath();
      ctx.arc(0, 2, size * .48, Math.PI, 0);
      ctx.lineTo(size * .48, size * .24);
      ctx.quadraticCurveTo(0, size * .55, -size * .48, size * .24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#64bd62';
      ctx.fillRect(-size * .3, 1, size * .6, size * .12);
    }
    ctx.restore();
  }

  function drawOpeningSpeechBubble(x, y, text, accent) {
    ctx.save();
    ctx.font = '900 12px Arial';
    ctx.textAlign = 'center';
    const width = Math.max(94, ctx.measureText(text).width + 28);
    const left = clamp(x - width / 2, 12, canvas.width - width - 12);
    roundedRect(left, y, width, 36, 13, 'rgba(26,13,58,.94)', accent, 3);
    ctx.fillStyle = 'rgba(26,13,58,.94)';
    ctx.beginPath();
    ctx.moveTo(clamp(x, left + 24, left + width - 24) - 7, y + 34);
    ctx.lineTo(clamp(x, left + 24, left + width - 24) + 5, y + 34);
    ctx.lineTo(clamp(x, left + 24, left + width - 24) - 2, y + 47);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff8dc';
    ctx.fillText(text, left + width / 2, y + 23);
    ctx.restore();
  }

  function drawRoadsterWheel(x, y, radius, rotation, accent) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = '#12152b';
    ctx.strokeStyle = '#060714';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dce9ef';
    ctx.beginPath(); ctx.arc(0, 0, radius * .53, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    for (let spoke = 0; spoke < 6; spoke += 1) {
      const angle = spoke * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * radius * .18, Math.sin(angle) * radius * .18);
      ctx.lineTo(Math.cos(angle) * radius * .5, Math.sin(angle) * radius * .5);
      ctx.stroke();
    }
    ctx.fillStyle = '#32214f';
    ctx.beginPath(); ctx.arc(0, 0, radius * .17, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawOpeningRoadster(screenX, y, time, launchProgress = 0) {
    const width = OPENING_ROADSTER_SOURCE_WIDTH;
    const height = OPENING_ROADSTER_SOURCE_HEIGHT;
    const drawScale = OPENING_ROADSTER_DRAW_WIDTH / width;
    const revShake = game.opening.phase === 'revving' ? Math.sin(time * .06) * 2.2 : 0;
    const frontLift = launchProgress > .08
      ? Math.sin(clamp((launchProgress - .08) / .92, 0, 1) * Math.PI) * 5.5
      : 0;
    ctx.save();
    ctx.translate(screenX + OPENING_ROADSTER_DRAW_WIDTH / 2, y + OPENING_ROADSTER_DRAW_HEIGHT);
    ctx.rotate(-launchProgress * .018 + Math.sin(time * .028) * launchProgress * .006);
    ctx.scale(drawScale, drawScale);
    ctx.translate(-width / 2, -height - revShake - frontLift);
    const wheelRotation = game.opening.carX * .052 + time * .0018 * Math.max(.12, launchProgress);
    ctx.save();
    ctx.globalAlpha = .34 + launchProgress * .24;
    ctx.shadowColor = '#50e7ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#50e7ff';
    ctx.beginPath();
    ctx.ellipse(width / 2, 137, 94, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (images.bandOliviaCrowd) {
      ctx.drawImage(images.bandOliviaCrowd, 381, 386, 279, 192, 0, 0, width, height);
    } else {
      roundedRect(4, 62, width - 8, 70, 30, '#18c9cf', '#fff8dc', 4);
      ctx.fillStyle = '#18314f';
      ctx.beginPath();
      ctx.arc(52, 132, 23, 0, Math.PI * 2);
      ctx.arc(width - 47, 132, 23, 0, Math.PI * 2);
      ctx.fill();
      drawOlivia(70, 5, time, 0);
    }
    const suspension = Math.sin(time * .018 + launchProgress * 5) * (game.opening.phase === 'departing' ? 1.8 : .6);
    drawRoadsterWheel(49, 132 + suspension, 19, wheelRotation, '#ff4fac');
    drawRoadsterWheel(169, 132 - suspension * .35, 19, wheelRotation, '#50e7ff');
    if (game.opening.phase === 'revving' || game.opening.phase === 'departing') {
      ctx.save();
      ctx.globalAlpha = .32 + launchProgress * .45;
      ctx.fillStyle = '#ffd65a';
      for (let dust = 0; dust < 5; dust += 1) {
        const dustX = 24 - dust * (12 + launchProgress * 18);
        const dustY = 136 - dust % 2 * 8 + Math.sin(time * .014 + dust) * 3;
        ctx.beginPath(); ctx.arc(dustX, dustY, 3 + dust * .7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawOpeningScene(time) {
    const opening = game.opening;
    if (opening.finished || opening.phase === 'finished') return;
    const standingX = OPENING_ROADSTER_X - game.cameraX;
    const roadsterX = opening.carX - game.cameraX;

    if (opening.phase === 'loading') {
      if (standingX < -330 || standingX > canvas.width + 180) return;
      const loadBob = Math.sin(time * .012) * 1.7;
      if (images.bandOliviaCrowd) {
        ctx.drawImage(
          images.bandOliviaCrowd,
          37, 316, 325, 260,
          standingX, GROUND_Y - OPENING_LOADING_DRAW_HEIGHT + loadBob,
          OPENING_LOADING_DRAW_WIDTH, OPENING_LOADING_DRAW_HEIGHT,
        );
      } else {
        drawOpeningRoadster(standingX + 26, GROUND_Y - OPENING_ROADSTER_DRAW_HEIGHT, time);
        drawOlivia(standingX - 8, GROUND_Y - 112, time, 0);
      }

      // The crate and three looping taco arcs make Olivia's loading action
      // readable even though the premium Olivia-and-roadster art is composed
      // as a single grounded illustration.
      roundedRect(standingX - 34, GROUND_Y - 47, 54, 45, 7, '#a85732', '#ffd65a', 3);
      ctx.fillStyle = '#6d3026';
      ctx.fillRect(standingX - 29, GROUND_Y - 35, 44, 5);
      ctx.fillRect(standingX - 29, GROUND_Y - 20, 44, 5);
      for (let crateTaco = 0; crateTaco < 3; crateTaco += 1) {
        drawOpeningTacoSprite(standingX - 21 + crateTaco * 15, GROUND_Y - 49, 18, -.2 + crateTaco * .17);
      }
      for (let taco = 0; taco < 3; taco += 1) {
        const cycle = (opening.timer * 1.18 + taco * .33) % 1;
        const progress = smoothStep(cycle);
        const x = standingX + 24 + progress * 78;
        const y = GROUND_Y - 102 - Math.sin(progress * Math.PI) * 42 + progress * 44;
        drawOpeningTacoSprite(x, y, 21, cycle * Math.PI * 2, 1 - Math.max(0, cycle - .88) / .12);
      }
      drawOpeningSpeechBubble(standingX + 50, GROUND_Y - 164, 'ONE MORE TACO…', '#ffd65a');
      return;
    }

    if (opening.phase === 'boarding') {
      if (standingX < -330 || standingX > canvas.width + 220) return;
      const progress = smoothStep(
        (opening.timer - openingTimeline.loadingEnd)
          / (openingTimeline.boardingEnd - openingTimeline.loadingEnd),
      );
      if (images.bandOliviaCrowd) {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.translate(0, Math.sin(progress * Math.PI) * -6);
        ctx.drawImage(
          images.bandOliviaCrowd,
          37, 316, 325, 260,
          standingX, GROUND_Y - OPENING_LOADING_DRAW_HEIGHT,
          OPENING_LOADING_DRAW_WIDTH, OPENING_LOADING_DRAW_HEIGHT,
        );
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = progress;
      drawOpeningRoadster(roadsterX, GROUND_Y - OPENING_ROADSTER_DRAW_HEIGHT, time);
      ctx.restore();
      if (progress > .55) drawOpeningSpeechBubble(roadsterX + OPENING_ROADSTER_DRAW_WIDTH / 2, GROUND_Y - 178, 'BUCKLED. MOSTLY.', '#50e7ff');
      return;
    }

    if (roadsterX < -280 || roadsterX > canvas.width + 320) return;
    const launchProgress = opening.phase === 'departing'
      ? clamp(
        (opening.timer - openingTimeline.revvingEnd)
          / (openingTimeline.departingEnd - openingTimeline.revvingEnd),
        0,
        1,
      )
      : 0;

    if (opening.phase === 'departing') {
      ctx.save();
      ctx.lineCap = 'round';
      for (let streak = 0; streak < 6; streak += 1) {
        const streakY = GROUND_Y - 30 - streak * 18;
        const length = 70 + launchProgress * 220 - streak * 10;
        const gradient = ctx.createLinearGradient(roadsterX - length, streakY, roadsterX, streakY);
        gradient.addColorStop(0, 'rgba(80,231,255,0)');
        gradient.addColorStop(1, streak % 2 ? 'rgba(255,79,172,.7)' : 'rgba(80,231,255,.72)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3 + (streak % 2);
        ctx.beginPath();
        ctx.moveTo(roadsterX - length, streakY);
        ctx.lineTo(roadsterX + 16, streakY);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawOpeningRoadster(roadsterX, GROUND_Y - OPENING_ROADSTER_DRAW_HEIGHT, time, launchProgress);
    if (opening.phase === 'revving') {
      drawOpeningSpeechBubble(roadsterX + OPENING_ROADSTER_DRAW_WIDTH / 2, GROUND_Y - 178, 'VROOM VROOM, TACO ROOM!', '#ff4fac');
    } else if (launchProgress < .46) {
      drawOpeningSpeechBubble(roadsterX + OPENING_ROADSTER_DRAW_WIDTH / 2, GROUND_Y - 178, 'SHOWTIME!', '#50e7ff');
    }
  }

  function drawWorld(time) {
    drawBackground(time);
    const marquee = world23Phase2Station('marquee');
    if (marquee && !game.phase2.preShowHidden) drawWorld23MarqueeBackplate(marquee, time);
    const rooftops = world23Phase2Station('rooftops');
    if (rooftops && !game.phase2.preShowHidden) drawWorld23RoadieRooftopsBackplate(rooftops, time);
    for (const platform of world.platforms) drawPlatform(platform, time);
    drawWorld23Phase2Destinations(time);
    drawCableCrawler(time);
    drawOpeningScene(time);
    for (const cameo of world.bandCameos) drawBandCameo(cameo, time);
    drawBoat(time);
    for (const item of world.tacos) drawTaco(item, time);
    for (const checkpoint of world.checkpoints) drawCheckpoint(checkpoint, time);
    for (const generator of world.generators) drawGenerator(generator, time);
    drawPinata(time);
    drawFeedbackFiendArena(time);
    for (let index = 0; index < world.fans.length; index += 1) drawFan(world.fans[index], index, time);
    for (const enemy of world.enemies) drawEnemy(enemy, time);
    heroCore.drawRespawnFX(ctx, game.respawn, player, game.cameraX, time, {
      vanish: '#ff4fac', vanishRing: '#50e7ff', landingRing: 'rgba(255,214,90,.88)',
    });
    drawPlayer(time);
  }

  function drawConcert(time) {
    const concertTime = game.concert.timer;
    const energy = game.energy / 100;
    const oliviaRoutine = getConcertOliviaRoutine(concertTime);
    if (images.farSky) ctx.drawImage(images.farSky, 0, 0, images.farSky.width, images.farSky.height, 0, 0, 960, 540);
    else {
      const sky = ctx.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, concertTime < 95 ? '#512764' : '#10143e');
      sky.addColorStop(.62, '#24164c');
      sky.addColorStop(1, '#0d0b28');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 960, 540);
    }
    ctx.fillStyle = 'rgba(7,7,42,.12)';
    ctx.fillRect(0, 0, 960, 540);
    if (images.midground) drawMidgroundPanel('concert', 1, -60);
    drawTimeOfDayAtmosphere(1);

    const ledColors = ['#ff4fac', '#50e7ff', '#a4f766', '#ffd65a', '#b780ff'];
    if (images.environmentStage) {
      ctx.save();
      ctx.drawImage(images.environmentStage, 33, 369, 1127, 364, -18, 160, 996, 322);
      ctx.restore();
    } else {
      ctx.fillStyle = '#4a2b38';
      ctx.fillRect(80, 225, 800, 235);
      ctx.fillStyle = '#241431';
      ctx.fillRect(105, 248, 750, 185);
      ctx.shadowColor = '#ff4fac';
      ctx.shadowBlur = 24;
      roundedRect(320, 177, 320, 58, 18, 'rgba(21,9,48,.92)', '#50e7ff', 4);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff4bf';
      ctx.font = '900 29px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('THE NEON NECKTIES', 480, 214);
    }

    // Playable concert platforms use the same premium concert modules as the
    // stage and render behind the performers so the band stays readable.
    game.concert.platforms.forEach((platform) => {
      if (images.environmentStage) {
        const stageModule = {
          'concert-ground': [23, 847, 518, 64],
          'beach-ball': [1412, 766, 213, 139],
          note: [1184, 542, 429, 126],
          speaker: [1245, 384, 306, 124],
          'taco-balloon': [1185, 694, 206, 211],
        }[platform.style];
        if (platform.style === 'concert-ground') {
          for (let offset = 0; offset < platform.w; offset += 470) {
            ctx.drawImage(images.environmentStage, ...stageModule, platform.x + offset, platform.y - 7, 480, 66);
          }
        } else {
          const visualHeight = platform.style === 'taco-balloon' ? 88 : 56;
          ctx.drawImage(images.environmentStage, ...stageModule, platform.x - 8, platform.y - visualHeight + 16, platform.w + 16, visualHeight);
        }
      } else {
        const palette = { 'beach-ball': '#50e7ff', note: '#ff4fac', speaker: '#a4f766', 'taco-balloon': '#ffd65a', 'concert-ground': '#3b2457' };
        roundedRect(platform.x, platform.y, platform.w, platform.h, platform.style === 'concert-ground' ? 0 : 12, palette[platform.style] || '#4f3a72', '#fff', 2);
      }
    });

    // Band performance.
    for (let slot = 0; slot < concertBandOrder.length; slot += 1) {
      const index = concertBandOrder[slot];
      const member = band[index];
      const x = 220 + slot * 130;
      const performanceBeat = Math.sin(concertTime * (index === 4 ? 7 : 3.2) + index);
      const motion = performanceBeat * (1 + energy * .45);
      ctx.save();
      ctx.globalAlpha = .3;
      ctx.fillStyle = '#100a25';
      ctx.beginPath();
      ctx.ellipse(x, CONCERT_STAGE_FLOOR_Y + 2, index === 4 ? 55 : 38, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(x, CONCERT_STAGE_FLOOR_Y);
      // Every performance animation pivots around a fixed stage-floor contact
      // point, so expressive movement never turns into visible levitation.
      ctx.rotate(motion * .01);
      ctx.scale(1 + Math.abs(motion) * .004, 1 - Math.abs(motion) * .006);
      const phase = Math.floor(concertTime * (index === 4 ? 4 : 2.2) + index) % 2;
      if (drawReplacementBandSprite(
        index,
        phase,
        0,
        0,
        145,
        154,
      )) {
        ctx.restore();
        continue;
      }
      if (images.bandOliviaCrowd) {
        const performanceFrames = [
          [[13, 15, 176, 288], [203, 37, 121, 264]],
          [[368, 12, 197, 288], [532, 36, 187, 265]],
          [[717, 9, 162, 296], [866, 33, 153, 275]],
          [[1032, 28, 140, 276], [1171, 28, 140, 276]],
          [[1306, 29, 179, 263], [1485, 29, 179, 263]],
        ];
        const sprite = performanceFrames[index][phase];
        const w = index === 4 ? 124 : 94;
        const h = index === 4 ? 146 : 154;
        ctx.drawImage(images.bandOliviaCrowd, ...sprite, -w / 2, -h, w, h);
        ctx.restore();
        continue;
      }
      ctx.fillStyle = '#f0b88d';
      ctx.beginPath(); ctx.arc(0, -55, 15, 0, Math.PI * 2); ctx.fill();
      roundedRect(-19, -40, 38, 55, 9, '#15151f', member.color, 3);
      ctx.fillStyle = '#fff'; ctx.fillRect(-12, -36, 24, 28);
      ctx.fillStyle = member.color;
      ctx.beginPath(); ctx.moveTo(-5, -34); ctx.lineTo(5, -34); ctx.lineTo(9, -13); ctx.lineTo(0, -4); ctx.lineTo(-9, -13); ctx.closePath(); ctx.fill();
      if (member.role === 'GUITAR' || member.role === 'BASS') {
        ctx.strokeStyle = member.color; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-24, -18); ctx.lineTo(31, -49); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-19, -13, 16, 10, -.5, 0, Math.PI * 2); ctx.stroke();
      } else if (member.role === 'KEYS') {
        ctx.fillStyle = '#eee'; ctx.fillRect(-28, -8, 56, 10);
      } else if (member.role === 'DRUMS') {
        ctx.strokeStyle = member.color; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(0, 2, 22, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.strokeStyle = member.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(18, -31); ctx.lineTo(30, 5); ctx.stroke();
      }
      ctx.restore();
    }

    // Current taco group.
    const group = Math.floor(concertTime / 11.5);
    game.concert.items.forEach((item) => {
      if (item.group !== group || item.collected) return;
      drawTaco(item, time, 0);
    });
    drawChorusTacoCannons(time);

    // Three layered rows all face the band. During Olivia's single out-and-back
    // crowd surf, the closest hands rise and follow her exact support line.
    drawConcertAudience(time, oliviaRoutine);
    // Only two compact edge bubbles remain in the concert. The larger fan
    // conversation lives in the victory dash, preserving a clear view of the
    // performers, Olivia, and Taco Hero during the playable show.
    [
      { x: 92, message: 'NEON NECKTIES FOREVER!', color: '#50e7ff' },
      { x: 868, message: 'PLAY THE ONE ABOUT THE TACOS!', color: '#ffd65a' },
    ].forEach((fan, index) => {
      const bounce = Math.sin(time * .006 + index) * 2;
      drawNpcChatBubble(fan.message, fan.color, {
        centerX: fan.x,
        bottomY: 468 + bounce,
        anchorX: fan.x + (index === 0 ? -3 : 3),
        anchorY: 486 + bounce,
        width: 128,
        compact: true,
        fontSize: fan.message.length > 24 ? 7 : 8,
      });
    });

    drawConcertOlivia(time, oliviaRoutine);
    for (const item of game.concert.chorusTacos) drawTaco(item, time, 0);

    // Energy-driven show layers.
    const beams = 3 + Math.floor(energy * 7);
    ctx.save();
    ctx.globalAlpha = .14 + energy * .17;
    for (let beam = 0; beam < beams; beam += 1) {
      ctx.fillStyle = ledColors[beam % 5];
      ctx.beginPath();
      const baseX = 100 + beam * (760 / Math.max(1, beams - 1));
      ctx.moveTo(baseX - 25, 245);
      ctx.lineTo(baseX + 25, 245);
      ctx.lineTo(480 + Math.sin(concertTime + beam) * 180, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (concertTime >= 142) {
      if (!game.fireworks.length && Math.floor(concertTime * 2) % 3 === 0) spawnFireworks(8);
    }

  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (game.cameraShake > 0) {
      const shake = game.reducedShake ? game.cameraShake * .2 : game.cameraShake;
      ctx.translate((random() - .5) * shake, (random() - .5) * shake * .6);
    }
    if (game.state === 'concert' || game.state === 'results') {
      drawConcert(time);
      drawEffects();
      drawPlayer(time, true);
    } else {
      drawWorld(time);
      drawEffects();
    }
    ctx.restore();
    drawHUD(time);
    drawWorld23Phase2Overlay(time);

    if (qaMode) {
      canvas.dataset.qaState = JSON.stringify({
        sourceVersion: SOURCE_VERSION,
        state: game.state,
        player: { x: Math.round(player.x), y: Math.round(player.y), vx: Math.round(player.vx), vy: Math.round(player.vy), grounded: player.grounded },
        superHero: { ...abilities.snapshot(game.abilities), collisionWidth: player.w, collisionHeight: player.h },
        score: game.score,
        collected: game.collected,
        bestSplat: game.bestSplat,
        goldenCollected: game.golden,
        goldenTotal: game.totalGolden,
        energy: Number(game.energy.toFixed(2)),
        latestCheckpoint: game.latestCheckpoint ? { name: game.latestCheckpoint.name, x: game.latestCheckpoint.x } : null,
        section: game.state === 'concert' ? 'concert' : currentSection().id,
        worldWidth: WORLD_WIDTH,
        platforms: world.platforms.length,
        movingPlatforms: world.platforms.filter((platform) => platform.moving).length,
        collectibles: game.totalTacos,
        golden: game.totalGolden,
        enemies: world.enemies.length,
        victoryEnemies: world.enemies.filter((enemy) => enemy.x >= 33000).length,
        fans: world.fans.length,
        uniqueFanChats: new Set(world.fans.map((fan) => fan.message)).size,
        npcDialogue: {
          presentation: 'anchored-rounded-chat-bubbles',
          victoryBubbles: world.fans.length,
          concertBubbles: 2,
          staggeredTiers: new Set(world.fans.map((fan) => fan.bubbleTier)).size,
          handheldSigns: false,
        },
        routeMaxGap: game.routeMaxGap,
        world23RouteAudit: game.world23RouteAudit,
        world23Phase2Audit: game.world23Phase2Audit,
        phase2: {
          stations: world.phase2Stations.map((station) => ({
            id: station.id,
            completed: station.completed,
            secret: Boolean(station.secret),
            progress: Number((station.progress || 0).toFixed(2)),
                rewardSpawned: station.rewardSpawned,
                dialogueActive: station.dialogueTimer > 0,
                dialoguePlayed: station.dialoguePlayed,
          })),
          completedIds: [...game.phase2.completedIds],
          visibleCompletionUsesDiscovered: false,
          discoveredBannerStation: 'encore',
          groundCameo: {
            member: band[world.bandCameos[0]?.member || 0].name,
            casual: Boolean(world.bandCameos[0]?.casual),
            seen: game.phase2.groundCameoSeen,
          },
          casualMemberOrder: [0, 2, 4, 1, 3].map((index) => band[index].name),
          uniqueCasualMembers: new Set([0, 2, 4, 1, 3]).size,
          casualVisible: game.state === 'playing' && !game.phase2.preShowHidden,
          preShowHiddenForConcert: game.phase2.preShowHidden,
          bassPads: world.bassPads.length,
          bassLaunchVelocity: BASS_STACK_LAUNCH_VELOCITY,
          bassBeatSeconds: BASS_STACK_BEAT_SECONDS,
          safeDropToMainRoute: true,
          repeatProtected: world.phase2Stations.every((station) => typeof station.completed === 'boolean'),
          marqueeServiceLift: (() => {
            const lift = world.platforms.find((platform) => platform.phase2Style === 'marquee-service-lift');
            return lift ? {
              y: Math.round(lift.y),
              baseY: lift.baseY,
              minY: lift.baseY - lift.range,
              maxY: lift.baseY + lift.range,
              range: lift.range * 2,
              axis: lift.axis,
              moving: lift.moving,
              carryingPlayer: player.platform?.id === lift.id,
            } : null;
          })(),
          roadieFreightLift: (() => {
            const lift = world.platforms.find((platform) => platform.phase2Style === 'roadie-freight-lift');
            return lift ? {
              y: Math.round(lift.y),
              baseY: lift.baseY,
              minY: lift.baseY - lift.range,
              maxY: lift.baseY + lift.range,
              range: lift.range * 2,
              axis: lift.axis,
              moving: lift.moving,
              carryingPlayer: player.platform?.id === lift.id,
            } : null;
          })(),
        },
        cableCrawler: {
          name: 'CABLE CRAWLER',
          phase: game.cableCrawler.phase,
          health: game.cableCrawler.health,
          maxHealth: game.cableCrawler.maxHealth,
          triggered: game.cableCrawler.triggered,
          defeated: game.cableCrawler.defeated,
          hitsTaken: game.cableCrawler.hitsTaken,
          retryCount: game.cableCrawler.retryCount,
          rewardSpawned: game.cableCrawler.rewardSpawned,
          utilityPowered: game.cableCrawler.utilityPowered,
          concertFallbackPowered: game.cableCrawler.concertFallbackPowered,
          arena: { ...CABLE_CRAWLER_ARENA, bossX: CABLE_CRAWLER_X },
          attacks: ['cable-sweep', 'power-plug-pop'],
          damageMethod: 'three-stomps-on-exposed-core',
          normalHeroCapable: true,
          superHeroRequired: false,
          blocksMainRoute: false,
          activeSweep: Boolean(game.cableCrawler.sweep),
          activePlugTargets: game.cableCrawler.plugTargets.length,
        },
        boss: {
          name: 'THE FEEDBACK FIEND',
          phase: game.boss.phase,
          health: game.boss.health,
          maxHealth: game.boss.maxHealth,
          defeated: game.boss.defeated,
          gateOpen: game.boss.gateOpen,
          hitsTaken: game.boss.hitsTaken,
          retryCount: game.boss.retryCount,
          rewardSpawned: game.boss.rewardSpawned,
          arena: { ...FEEDBACK_FIEND_ARENA, bossX: FEEDBACK_FIEND_X },
          attacks: ['bass-shockwave', 'feedback-drop', 'cable-sweep'],
          damageMethod: 'three-stomps-on-open-amp-core',
          normalHeroCapable: true,
          superHeroRequired: false,
          activeShockwaves: game.boss.shockwaves.length,
          activeFeedbackDrops: game.boss.feedbackDrops.length,
          cableSweepActive: Boolean(game.boss.cableSweep),
        },
        world23CombatAudit: game.world23CombatAudit,
        platformOverlapCount: game.platformOverlapCount,
        platformOverlapPairs: game.platformOverlapPairs || [],
        platformSweepCrossings: game.platformSweepCrossings || 0,
        tacoCoins: world.tacos.filter((item) => item.type === 'tacoCoin').length,
        generators: game.generators,
        generatorDefenseAudit: game.generatorDefenseAudit,
        opening: {
          phase: game.opening.phase,
          timer: Number(game.opening.timer.toFixed(2)),
          carX: Math.round(game.opening.carX),
          finished: game.opening.finished,
        },
        pinata: {
          hits: game.pinata.hits,
          exploded: game.pinata.exploded,
          explosionTimer: Number(game.pinata.explosionTimer.toFixed(2)),
        },
        boat: {
          active: game.boat.active,
          waterlineY: BOAT_WATERLINE_Y,
          renderWidth: BOAT_RENDER_WIDTH,
          leadDistance: Math.round(game.boat.x - player.x),
          throwActive: game.boat.throwTimer > 0,
          throwProgress: game.boat.throwTimer > 0
            ? Number((1 - game.boat.throwTimer / BOAT_THROW_DURATION).toFixed(2))
            : -1,
          throwCount: game.boat.throwCount,
          catches: game.boat.catches,
          pendingVolley: game.boat.pendingVolley,
          launchFlash: Number(game.boat.launchFlash.toFixed(2)),
          launchPoint: {
            x: Math.round(game.boat.x + BOAT_LAUNCH_X_OFFSET),
            y: BOAT_WATERLINE_Y + BOAT_LAUNCH_Y_OFFSET,
          },
          staticOliviaPose: true,
          animatedArm: false,
          airborneTacoVelocities: world.tacos
            .filter((item) => item.airborneDrop && !item.collected)
            .slice(-3)
            .map((item) => Math.round(item.vx)),
        },
        concert: {
          started: game.concert.started, timer: Number(game.concert.timer.toFixed(2)),
          duration: game.concert.duration, cueIndex: game.concert.cueIndex,
          entryReason: game.concert.entryReason,
          entryTriggerX: CONCERT_ENTRY_TRIGGER_X,
          invisibleRouteGate: false,
          entryStatus: getConcertEntryStatus(),
          entryDecision: game.concert.entryDecision
            || resolveConcertEntry(player.x, game.score, getConcertEntryStatus()),
          oliviaPhase: getConcertOliviaRoutine(game.concert.timer).phase,
          chorusTacos: game.concert.chorusTacos.length,
          chorusVolleys: game.concert.chorusVolleys.size,
          controlRecoveries: game.concert.controlRecoveries,
          songReady: tracks.concert.readyState >= 2, activeMusic: game.activeMusic,
          venueSystems: game.concert.venueSystems,
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
        respawn: {
          active: game.respawn.active,
          phase: game.respawn.active ? (game.respawn.spawnPlaced ? 'drop' : game.respawn.timer < .38 ? 'vanish' : 'beam') : 'inactive',
          targetY: Math.round(game.respawn.targetY || 0),
          count: game.respawnCount,
          fallbacks: game.respawnFallbacks,
          lastLanding: game.lastRespawnLanding,
        },
        visualGrounding: {
          checkpoints: world.checkpoints.filter((checkpoint) => checkpoint.grounded).length,
          checkpointTotal: world.checkpoints.length,
          bandCameos: world.bandCameos.filter((cameo) => cameo.grounded).length,
          bandCameoTotal: world.bandCameos.length,
          concertMembers: band.length,
          premiumAudience: Boolean(images.concertAudience),
          premiumNova: Boolean(images.nova),
          replacementBandArt: Boolean(images.bandReplacements),
          premiumPinata: Boolean(images.neonPinata),
          premiumTambourine: Boolean(images.tacoTambourine),
          premiumPreShowBand: Boolean(images.preShowBand),
          preShowBandAlphaRemoved: images.preShowBandAlphaRemoved || 0,
          premiumGroundedMarqueeStructure: Boolean(images.marqueeStructure),
          premiumWelcomeCheckInBooth: Boolean(images.welcomeCheckInBooth),
          marqueeStructureUsesTrueAlpha: true,
          premiumRoadieLoadingAnnex: Boolean(images.roadieLoadingAnnex),
          premiumRoadieVenueTower: Boolean(images.roadieVenueTower),
          premiumRoadieServiceCluster: Boolean(images.roadieServiceCluster),
          premiumRoadieFreightCage: Boolean(images.roadieFreightCage),
          premiumRoadieMilo: Boolean(images.roadieMilo),
          premiumRoadieRex: Boolean(images.roadieRex),
          premiumCableCrawler: Boolean(images.cableCrawler),
          roadiePerformerFeetAnchoredToRehearsalDeck: true,
          premiumPhase2Landmarks: Boolean(images.world23Landmarks),
          landmarkAlphaRemoved: images.landmarkAlphaRemoved || 0,
          premiumFeedbackFiend: Boolean(images.feedbackFiend),
          bandFeetAnchoredToSurface: Boolean(images.preShowBandBounds),
          checkpointArtCroppedToFoundation: Boolean(images.checkpointBounds),
          checkpointOliviaFeetAnchored: Boolean(images.checkpointOliviaBounds),
          enemies: world.enemies.filter((enemy) => Math.abs((enemy.baseY ?? enemy.y) + enemy.h - GROUND_Y) < 2).length,
          enemyTotal: world.enemies.length,
          sharedHeroArt: Boolean(images.hero),
          sharedTacoArt: Boolean(images.items),
          parallaxLayers: Object.values(environmentImageKeys).filter((key) => Boolean(images[key])).length,
          authoredCheckpoints: Boolean(images.checkpointStations),
          modularTerrain: Boolean(images.terrainRemaster),
          layeredRoadsterWheels: true,
          openingRoadsterWidth: OPENING_ROADSTER_DRAW_WIDTH,
          openingLoadingPoseWidth: OPENING_LOADING_DRAW_WIDTH,
          staticCatamaran: Boolean(images.catamaranRemasterBase || images.islandCatamaran),
        },
        environmentRemaster: {
          ready: Boolean(game.environmentRemasterReady && game.foregroundRemasterReady),
          background: game.backgroundBlend || null,
          transitionWidth: ENVIRONMENT_TRANSITION_WIDTH,
          panoramaCrop: ENVIRONMENT_PANORAMA_CROP,
          authoredActs: Object.values(environmentImageKeys).filter((key) => Boolean(images[key])).length,
          terrainFamilies: Object.keys(terrainRows).length,
          checkpointFamilies: world.checkpoints.length,
          noTiling: true,
          subpixelMotion: true,
        },
        heroPhysics,
        fullscreenReady: Boolean(document.fullscreenEnabled || navigator.standalone),
      });
    }
  }

  function frame(now) {
    if (!lastFrame) lastFrame = now;
    const dt = Math.min(.033, (now - lastFrame) / 1000);
    lastFrame = now;
    update(dt);
    draw(now);
    requestAnimationFrame(frame);
  }

  function measureAlphaBoundsByGrid(sheet, columns, rows) {
    const boundsCanvas = document.createElement('canvas');
    boundsCanvas.width = sheet.width;
    boundsCanvas.height = sheet.height;
    const boundsContext = boundsCanvas.getContext('2d', { willReadFrequently: true });
    boundsContext.drawImage(sheet, 0, 0);
    const data = boundsContext.getImageData(0, 0, sheet.width, sheet.height).data;
    const cellWidth = sheet.width / columns;
    const cellHeight = sheet.height / rows;
    const bounds = Array.from({ length: columns * rows }, () => ({
      minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY,
    }));
    for (let y = 0; y < sheet.height; y += 1) {
      for (let x = 0; x < sheet.width; x += 1) {
        if (data[(y * sheet.width + x) * 4 + 3] < 18) continue;
        const column = Math.min(columns - 1, Math.floor(x / cellWidth));
        const row = Math.min(rows - 1, Math.floor(y / cellHeight));
        const cell = bounds[row * columns + column];
        cell.minX = Math.min(cell.minX, x);
        cell.minY = Math.min(cell.minY, y);
        cell.maxX = Math.max(cell.maxX, x);
        cell.maxY = Math.max(cell.maxY, y);
      }
    }
    return bounds.map((cell, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      if (!Number.isFinite(cell.minX)) {
        return { x: column * cellWidth, y: row * cellHeight, w: cellWidth, h: cellHeight };
      }
      return {
        x: cell.minX, y: cell.minY,
        w: cell.maxX - cell.minX + 1,
        h: cell.maxY - cell.minY + 1,
      };
    });
  }

  function measureImageRegionAlphaBounds(sheet, sourceX, sourceY, sourceWidth, sourceHeight) {
    const boundsCanvas = document.createElement('canvas');
    boundsCanvas.width = sourceWidth;
    boundsCanvas.height = sourceHeight;
    const boundsContext = boundsCanvas.getContext('2d', { willReadFrequently: true });
    boundsContext.drawImage(
      sheet,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, sourceWidth, sourceHeight,
    );
    const bounds = measureAlphaBoundsByGrid(boundsCanvas, 1, 1)[0];
    return {
      x: sourceX + bounds.x,
      y: sourceY + bounds.y,
      w: bounds.w,
      h: bounds.h,
    };
  }

  function prepareNeutralBackgroundSheet(source, counterKey) {
    if (!source) return null;
    const sheet = document.createElement('canvas');
    sheet.width = source.width;
    sheet.height = source.height;
    const sheetContext = sheet.getContext('2d', { willReadFrequently: true });
    sheetContext.drawImage(source, 0, 0);
    const pixels = sheetContext.getImageData(0, 0, sheet.width, sheet.height);
    const { data } = pixels;
    const total = sheet.width * sheet.height;
    const visited = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;
    let removed = 0;
    const isBackground = (index) => {
      const offset = index * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const brightest = Math.max(red, green, blue);
      const darkest = Math.min(red, green, blue);
      return brightest - darkest <= 15 && (red + green + blue) / 3 >= 229;
    };
    const enqueue = (index) => {
      if (index < 0 || index >= total || visited[index] || !isBackground(index)) return;
      visited[index] = 1;
      queue[tail] = index;
      tail += 1;
    };
    for (let x = 0; x < sheet.width; x += 1) {
      enqueue(x);
      enqueue((sheet.height - 1) * sheet.width + x);
    }
    for (let y = 0; y < sheet.height; y += 1) {
      enqueue(y * sheet.width);
      enqueue(y * sheet.width + sheet.width - 1);
    }
    while (head < tail) {
      const index = queue[head];
      head += 1;
      data[index * 4 + 3] = 0;
      removed += 1;
      const x = index % sheet.width;
      if (x > 0) enqueue(index - 1);
      if (x < sheet.width - 1) enqueue(index + 1);
      if (index >= sheet.width) enqueue(index - sheet.width);
      if (index < total - sheet.width) enqueue(index + sheet.width);
    }
    sheetContext.putImageData(pixels, 0, 0);
    images[counterKey] = removed;
    return sheet;
  }

  function preparePreShowBandSheet(source) {
    const sheet = prepareNeutralBackgroundSheet(source, 'preShowBandAlphaRemoved');
    if (sheet) images.preShowBandBounds = measureAlphaBoundsByGrid(sheet, band.length, 1);
    return sheet;
  }

  function prepareWorld23LandmarkSheet(source) {
    const sheet = prepareNeutralBackgroundSheet(source, 'landmarkAlphaRemoved');
    if (sheet) images.world23LandmarkBounds = measureAlphaBoundsByGrid(sheet, 2, 2);
    return sheet;
  }

  function loadImage(path) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = path;
    });
  }

  Promise.all([
    loadImage('assets/taco_hero_sheet.png'),
    loadImage('assets/items_sheet.png'),
    loadImage('assets/neon_neckties_band_stage_v1.png'),
    loadImage('assets/neon_neckties_olivia_crowd_v1.png'),
    loadImage('assets/neon_neckties_world_enemies_v1.png'),
    loadImage('assets/neon_neckties_hero_terrain_items_v2.png'),
    loadImage('assets/neon_neckties_environment_stage_v2.png'),
    loadImage('assets/neon_neckties_band_olivia_crowd_v2.png'),
    loadImage('assets/neon_neckties_far_sky_v3.png'),
    loadImage('assets/neon_neckties_midground_v3.png'),
    loadImage('assets/neon_neckties_near_scenery_v3.png'),
    loadImage('assets/neon_neckties_audience_v1.png'),
    loadImage('assets/neon_neckties_nova_v2.png'),
    loadImage('assets/neon_neckties_milo_arman_v1.png'),
    loadImage('assets/world2_3_neon_neckties_preshow_v1.png'),
    loadImage('assets/neon_neckties_pinata_v1.png'),
    loadImage('assets/neon_neckties_taco_tambourine_v1.png'),
    loadImage('assets/island_catamaran_sheet_v1.png'),
    loadImage('assets/world2_3_env_soundcheck_v1.webp'),
    loadImage('assets/world2_3_env_beach_v1.webp'),
    loadImage('assets/world2_3_env_rooftops_v1.webp'),
    loadImage('assets/world2_3_env_stampede_v1.webp'),
    loadImage('assets/world2_3_env_lagoon_v1.webp'),
    loadImage('assets/world2_3_env_powerup_v1.webp'),
    loadImage('assets/world2_3_env_victory_v1.webp'),
    loadImage('assets/world2_3_terrain_atlas_v1.webp'),
    loadImage('assets/world2_3_checkpoint_stations_v1.webp'),
    loadImage('assets/world2_1_catamaran_arm_layer_base_v1.webp'),
    loadImage('assets/world2_3_marquee_welcome_arch_v1.webp'),
    loadImage('assets/world2_3_welcome_checkin_booth_v1.webp'),
    loadImage('assets/world2_3_roadie_loading_annex_v1.webp'),
    loadImage('assets/world2_3_roadie_venue_tower_v1.webp'),
    loadImage('assets/world2_3_roadie_service_cluster_v1.webp'),
    loadImage('assets/world2_3_roadie_freight_cage_v1.webp'),
    loadImage('assets/world2_3_milo_rooftop_v1.png'),
    loadImage('assets/world2_3_rex_rooftop_v1.png'),
    loadImage('assets/world2_3_cable_crawler_v1.webp'),
    loadImage('assets/world2_3_preshow_landmarks_v2.webp'),
    loadImage('assets/world2_3_feedback_fiend_v1.webp'),
  ]).then(([
    hero, items, bandStage, oliviaCrowd, worldEnemies, heroTerrainItems,
    environmentStage, bandOliviaCrowd, farSky, midground, nearScenery,
    concertAudienceArt, nova, bandReplacements, preShowBandRaw, neonPinata, tacoTambourine,
    islandCatamaran,
    environmentSoundcheck, environmentBeach, environmentRooftops,
    environmentStampede, environmentLagoon, environmentPowerup, environmentVictory,
    terrainRemaster, checkpointStations, catamaranRemasterBase,
    marqueeStructureArt, welcomeCheckInBoothArt, roadieLoadingAnnexArt,
    roadieVenueTowerArt, roadieServiceClusterArt, roadieFreightCageArt,
    roadieMiloArt, roadieRexArt, cableCrawlerArt,
    world23LandmarksRaw, feedbackFiendArt,
  ]) => {
    images.hero = hero;
    images.items = items;
    images.bandStage = bandStage;
    images.oliviaCrowd = oliviaCrowd;
    images.worldEnemies = worldEnemies;
    images.heroTerrainItems = heroTerrainItems;
    images.environmentStage = environmentStage;
    images.bandOliviaCrowd = bandOliviaCrowd;
    images.farSky = farSky;
    images.midground = midground;
    images.nearScenery = nearScenery;
    images.concertAudience = concertAudienceArt;
    images.nova = nova;
    images.bandReplacements = bandReplacements;
    images.preShowBand = preparePreShowBandSheet(preShowBandRaw);
    images.neonPinata = neonPinata;
    images.tacoTambourine = tacoTambourine;
    images.islandCatamaran = islandCatamaran;
    images.environmentSoundcheck = environmentSoundcheck;
    images.environmentBeach = environmentBeach;
    images.environmentRooftops = environmentRooftops;
    images.environmentStampede = environmentStampede;
    images.environmentLagoon = environmentLagoon;
    images.environmentPowerup = environmentPowerup;
    images.environmentVictory = environmentVictory;
    images.terrainRemaster = terrainRemaster;
    images.checkpointStations = checkpointStations;
    images.catamaranRemasterBase = catamaranRemasterBase;
    images.marqueeStructure = marqueeStructureArt;
    images.welcomeCheckInBooth = welcomeCheckInBoothArt;
    images.roadieLoadingAnnex = roadieLoadingAnnexArt;
    images.roadieVenueTower = roadieVenueTowerArt;
    images.roadieServiceCluster = roadieServiceClusterArt;
    images.roadieFreightCage = roadieFreightCageArt;
    images.roadieMilo = roadieMiloArt;
    images.roadieRex = roadieRexArt;
    images.cableCrawler = cableCrawlerArt;
    if (images.cableCrawler) {
      images.cableCrawlerBounds = measureAlphaBoundsByGrid(images.cableCrawler, 4, 1);
    }
    images.world23Landmarks = prepareWorld23LandmarkSheet(world23LandmarksRaw);
    images.feedbackFiend = feedbackFiendArt;
    if (images.feedbackFiend) {
      images.feedbackFiendBounds = measureAlphaBoundsByGrid(images.feedbackFiend, 4, 1);
    }
    if (images.checkpointStations) {
      images.checkpointBounds = measureAlphaBoundsByGrid(images.checkpointStations, 3, 2);
    }
    if (images.bandOliviaCrowd) {
      images.checkpointOliviaBounds = measureImageRegionAlphaBounds(
        images.bandOliviaCrowd, 1300, 339, 157, 243,
      );
    }
    loadProgress();
    setupInputs();
    resetGame();
    syncSettings();
    updatePersonalBest();
    tracks.concert.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(tracks.concert.duration)) game.concert.duration = tracks.concert.duration;
      game.concert.songReady = true;
    });
    tracks.concert.addEventListener('ended', finishLevel);
    fetch('assets/neon_neckties/jump_for_tacos_final_concert_cues_v1.json?level=23')
      .then((response) => response.ok ? response.json() : null)
      .then((cues) => {
        if (Number.isFinite(cues?.durationSeconds)) game.concert.duration = cues.durationSeconds;
      })
      .catch(() => {});
    requestAnimationFrame(frame);
  });
})();
